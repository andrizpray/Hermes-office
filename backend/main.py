import asyncio
import random
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

# ─────────────────────────────────────────
# Socket.IO Server
# ─────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

# ─────────────────────────────────────────
# Agent State
# ─────────────────────────────────────────
class Agent:
    def __init__(self, name: str, role: str):
        self.id = str(uuid.uuid4())[:8]
        self.name = name
        self.role = role
        self.status = 'idle'
        self.current_task: Optional[str] = None
        self.last_activity = datetime.now().isoformat()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'status': self.status,
            'currentTask': self.current_task,
            'lastActivity': self.last_activity,
            'position': None
        }

AGENTS = {
    'dev': Agent('DevBot', 'Backend Developer'),
    'design': Agent('DesignBot', 'UI/UX Designer'),
    'data': Agent('DataBot', 'Data Analyst'),
    'qa': Agent('QABot', 'Quality Assurance'),
}

SIMULATION_RUNNING = False
TASKS = [
    'Processing data pipeline...',
    'Designing new component...',
    'Running tests...',
    'Analyzing logs...',
    'Updating documentation...',
    'Fixing bugs...',
    'Deploying to staging...',
    'Writing tests...',
]

async def simulate_activity():
    global SIMULATION_RUNNING
    while SIMULATION_RUNNING:
        await asyncio.sleep(random.randint(4, 10))
        
        agent = random.choice(list(AGENTS.values()))
        
        if agent.status == 'idle':
            agent.status = 'working'
            agent.current_task = random.choice(TASKS)
            event_type = 'status_change'
        elif agent.status == 'working':
            agent.status = 'idle'
            agent.current_task = None
            event_type = 'task_complete'
        else:
            agent.status = 'idle'
            event_type = 'status_change'
        
        agent.last_activity = datetime.now().isoformat()
        
        await sio.emit('agent:update', agent.to_dict())
        await sio.emit('agent:event', {
            'type': event_type,
            'agentId': agent.id,
            'timestamp': agent.last_activity,
            'data': {'task': agent.current_task}
        })
        
        print(f'[Sim] {agent.name} -> {agent.status} | {agent.current_task or "idle"}')

# ─────────────────────────────────────────
# Socket.IO Events
# ─────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    global SIMULATION_RUNNING
    print(f'[Socket.IO] Client connected: {sid}')
    await sio.emit('agents:init', [a.to_dict() for a in AGENTS.values()], to=sid)
    
    if not SIMULATION_RUNNING:
        SIMULATION_RUNNING = True
        asyncio.create_task(simulate_activity())

@sio.event
async def disconnect(sid):
    print(f'[Socket.IO] Client disconnected: {sid}')

@sio.event
async def message(sid, data):
    print(f'[Socket.IO] Message from {sid}: {data}')
    await sio.emit('response', {'echo': data}, to=sid)

@sio.event
async def chat_send(sid, data):
    agent_id = data.get('agentId')
    if not agent_id:
        return
    for agent in AGENTS.values():
        if agent.id == agent_id:
            agent.last_activity = datetime.now().isoformat()
            await sio.emit('agent:update', agent.to_dict())
            break

# ─────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(fastapp: FastAPI):
    global SIMULATION_RUNNING
    SIMULATION_RUNNING = True
    asyncio.create_task(simulate_activity())
    yield
    SIMULATION_RUNNING = False

fastapp = FastAPI(title="HermesOffice Backend", lifespan=lifespan)
fastapp.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

@fastapp.get('/')
async def root():
    return {'status': 'HermesOffice Backend running', 'agents': len(AGENTS)}

@fastapp.get('/health')
async def health():
    return {'status': 'ok', 'timestamp': datetime.now().isoformat()}

@fastapp.get('/api/agents')
async def get_agents():
    return {'agents': [a.to_dict() for a in AGENTS.values()]}

@fastapp.get('/api/agents/{agent_id}')
async def get_agent(agent_id: str):
    for agent in AGENTS.values():
        if agent.id == agent_id:
            return agent.to_dict()
    return {'error': 'Agent not found'}

# ─────────────────────────────────────────
# Combined ASGI App (export this)
# ─────────────────────────────────────────
app = socketio.ASGIApp(sio, fastapp)

# ─────────────────────────────────────────
# Run with: python main.py
# ─────────────────────────────────────────
if __name__ == '__main__':
    import uvicorn
    print('[HermesOffice] Starting backend on http://0.0.0.0:8000')
    uvicorn.run(app, host='0.0.0.0', port=8000)
