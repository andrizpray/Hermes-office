import { getState, getRooms, startSimulation } from '@/lib/office-store';

export const dynamic = 'force-dynamic';

startSimulation();

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        try {
          const data = `data: ${JSON.stringify({ ...getState(), rooms: getRooms() })}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          if (intervalId) clearInterval(intervalId);
        }
      };

      send();
      intervalId = setInterval(send, 500);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
