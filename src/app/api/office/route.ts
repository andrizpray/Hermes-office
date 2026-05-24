import { NextResponse } from 'next/server';
import { getState, getRooms, startSimulation } from '@/lib/office-store';

startSimulation();

export async function GET() {
  const state = getState();
  return NextResponse.json({ ...state, rooms: getRooms() });
}
