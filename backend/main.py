"""
HermesOffice Backend
Connects to real Hermes Agent Gateway when available,
falls back to simulation mode otherwise.
"""
import asyncio
import os
import random
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────
HERMES_GATEWAY_URL = os.getenv('HERMES_GATEWAY_URL', 'http://localhost:8080')
HERMES_API_KEY = os.getenv('HERMES_API_KEY', '')
USE_SIMULATION = os.getenv('HERMES_SIMULATION', 'true').lower() == 'true'

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
    def __init__(self, agent_id: str, name: str, role: str, status='idle', current_task: Optional[str] = None):
        self.id = agent_id
        self.name = name
        self.role = role
        self.status: str = status
        self.current_task: Optional[str] = current_task
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

    def update(self, status: str, task: Optional[str] = None):
        self.status = status
        self.current_task = task
        self.last_activity = datetime.now().isoformat()


# Demo-mode agents (fallback)
DEMO_AGENTS = {
    'dev': Agent('demo-dev', 'DevBot', 'Backend Developer'),
    'design': Agent('demo-design', 'DesignBot', 'UI/UX Designer'),
    'data': Agent('demo-data', 'DataBot', 'Data Analyst'),
    'qa': Agent('demo-qa', 'QABot', 'Quality Assurance'),
}

# Active agents (either demo or real Hermes workers)
AGENTS: dict[str, Agent] = {}

SIMULATION_RUNNING = False
DEMO_TASKS = [
    'Processing data pipeline...',
    'Designing new component...',
    'Running tests...',
    'Analyzing logs...',
    'Updating documentation...',
    'Fixing bugs...',
    'Deploying to staging...',
    'Writing tests...',
    'Optimizing queries...',
    'Reviewing pull requests...',
]


# ─────────────────────────────────────────
# Hermes Gateway Integration
# ─────────────────────────────────────────
async def fetch_hermes_cron_jobs() -> list[dict]:
    """Fetch active cron jobs from Hermes Gateway."""
    headers = {'Authorization': f'Bearer {HERMES_API_KEY}'} if HERMES_API_KEY else {}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f'{HERMES_GATEWAY_URL}/api/cron/jobs', headers=headers)
            if resp.status_code == 200:
                return resp.json().get('jobs', [])
    except Exception:
        pass
    return []


async def fetch_hermes_status() -> dict:
    """Fetch Hermes Agent status."""
    headers = {'Authorization': f'Bearer {HERMES_API_KEY}'} if HERMES_API_KEY else {}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f'{HERMES_GATEWAY_URL}/api/status', headers=headers)
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return {}


def hermes_jobs_to_agents(jobs: list[dict]) -> dict[str, Agent]:
    """Map Hermes cron jobs to office agents."""
    agents = {}
    for i, job in enumerate(jobs[:4]):  # Max 4 agents visible
        job_id = job.get('id', f'hermes-{i}')
        status = 'working' if job.get('status') == 'running' else 'idle'
        task = job.get('name', job.get('prompt', '')[:40]) if status == 'working' else None
        agent = Agent(
            agent_id=f'hermes-{job_id}',
            name=f"Hermes-{job.get('name', f'Worker{i+1}')[:12]}",
            role='AI Agent',
            status=status,
            current_task=task,
        )
        agents[job_id] = agent
    return agents


async def hermes_activity_loop():
    """Poll Hermes Gateway and emit updates."""
    global AGENTS

    while True:
        await asyncio.sleep(8)

        jobs = await fetch_hermes_cron_jobs()
        if jobs:
            new_agents = hermes_jobs_to_agents(jobs)
            # Compare and emit diffs
            for job_id, agent in new_agents.items():
                old = AGENTS.get(job_id)
                if old:
                    if old.status != agent.status:
                        await sio.emit('agent:update', agent.to_dict())
                        await sio.emit('agent:event', {
                            'type': 'status_change',
                            'agentId': agent.id,
                            'timestamp': agent.last_activity,
                            'data': {'from': old.status, 'to': agent.status}
                        })
                    elif old.current_task != agent.current_task:
                        await sio.emit('agent:update', agent.to_dict())
                        if agent.current_task:
                            await sio.emit('agent:event', {
                                'type': 'task_start',
                                'agentId': agent.id,
                                'timestamp': agent.last_activity,
                                'data': {'task': agent.current_task}
                            })
                else:
                    # New agent
                    AGENTS[job_id] = agent
                    await sio.emit('agent:update', agent.to_dict())
                    await sio.emit('agent:event', {
                        'type': 'status_change',
                        'agentId': agent.id,
                        'timestamp': agent.last_activity,
                        'data': {'message': f'{agent.name} joined'}
                    })
        else:
            # No Hermes response — check if we should switch to simulation
            if not AGENTS and USE_SIMULATION:
                await start_simulation()


# ─────────────────────────────────────────
# Demo Simulation (fallback)
# ─────────────────────────────────────────
async def start_simulation():
    global AGENTS, SIMULATION_RUNNING
    AGENTS = dict(DEMO_AGENTS)
    SIMULATION_RUNNING = True

    # Emit initial agents
    await sio.emit('agents:init', [a.to_dict() for a in AGENTS.values()])
    print('[Sim] Demo simulation started (Hermes not reachable)')

    while SIMULATION_RUNNING:
        await asyncio.sleep(random.randint(4, 10))

        agent = random.choice(list(AGENTS.values()))
        prev_status = agent.status

        if agent.status == 'idle':
            agent.update('working', random.choice(DEMO_TASKS))
            event_type = 'task_start'
        elif agent.status == 'working':
            agent.update('idle', None)
            event_type = 'task_complete'
        else:
            agent.update('idle')
            event_type = 'status_change'

        await sio.emit('agent:update', agent.to_dict())
        await sio.emit('agent:event', {
            'type': event_type,
            'agentId': agent.id,
            'timestamp': agent.last_activity,
            'data': {
                'task': agent.current_task,
                'message': f'{agent.name} {event_type.replace("_", " ")}'
            }
        })
        print(f'[Sim] {agent.name} -> {agent.status} | {agent.current_task or "idle"}')


# ─────────────────────────────────────────
# Socket.IO Events
# ─────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    global SIMULATION_RUNNING, AGENTS
    print(f'[Socket.IO] Client connected: {sid}')

    # Check if Hermes is reachable
    if not USE_SIMULATION:
        jobs = await fetch_hermes_cron_jobs()
        if jobs:
            AGENTS = hermes_jobs_to_agents(jobs)
            await sio.emit('agents:init', [a.to_dict() for a in AGENTS.values()])
            print(f'[Hermes] Loaded {len(AGENTS)} agents from gateway')
            return

    # Fall back to simulation
    if not AGENTS:
        AGENTS = dict(DEMO_AGENTS)
    await sio.emit('agents:init', [a.to_dict() for a in AGENTS.values()])

    if not SIMULATION_RUNNING and USE_SIMULATION:
        SIMULATION_RUNNING = True
        asyncio.create_task(start_simulation())

    if not USE_SIMULATION and not asyncio.current_task().cancelled:
        asyncio.create_task(hermes_activity_loop())


@sio.event
async def disconnect(sid):
    print(f'[Socket.IO] Client disconnected: {sid}')


@sio.event
async def chat_send(sid, data):
    """Handle chat message to an agent."""
    agent_id = data.get('agentId')
    message = data.get('message', '')
    if not agent_id:
        return

    agent = AGENTS.get(agent_id)
    if not agent:
        return

    agent.last_activity = datetime.now().isoformat()
    await sio.emit('agent:update', agent.to_dict())
    await sio.emit('agent:event', {
        'type': 'message',
        'agentId': agent.id,
        'timestamp': agent.last_activity,
        'data': {'message': message[:100]}
    })

    # Echo response (demo — in real impl, this calls Hermes)
    await sio.emit('agent:event', {
        'type': 'message',
        'agentId': agent.id,
        'timestamp': datetime.now().isoformat(),
        'data': {'message': f'[Demo] Received: {message[:50]}...', 'from': 'agent'}
    })


# ─────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(fastapp: FastAPI):
    global AGENTS
    # Pre-populate with demo agents so /api/agents works immediately
    if not AGENTS:
        AGENTS = dict(DEMO_AGENTS)
    yield

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
    return {
        'status': 'HermesOffice Backend running',
        'mode': 'simulation' if USE_SIMULATION else 'hermes',
        'gateway': HERMES_GATEWAY_URL,
        'agents': len(AGENTS),
    }


@fastapp.get('/health')
async def health():
    return {'status': 'ok', 'timestamp': datetime.now().isoformat()}


@fastapp.get('/api/agents')
async def get_agents():
    return {'agents': [a.to_dict() for a in AGENTS.values()]}


@fastapp.get('/api/agents/{agent_id}')
async def get_agent(agent_id: str):
    agent = AGENTS.get(agent_id)
    if agent:
        return agent.to_dict()
    return {'error': 'Agent not found'}


@fastapp.get('/api/hermes/status')
async def hermes_status():
    """Check Hermes Gateway connectivity."""
    status = await fetch_hermes_status()
    jobs = await fetch_hermes_cron_jobs()
    return {
        'reachable': bool(status or jobs),
        'gateway_url': HERMES_GATEWAY_URL,
        'active_jobs': len(jobs),
        'status': status,
    }


# ─────────────────────────────────────────
# Combined ASGI App
# ─────────────────────────────────────────
app = socketio.ASGIApp(sio, fastapp)

if __name__ == '__main__':
    import uvicorn
    print(f'[HermesOffice] Backend starting...')
    print(f'  Mode: {"SIMULATION" if USE_SIMULATION else "HERMES"}')
    print(f'  Gateway: {HERMES_GATEWAY_URL}')
    uvicorn.run(app, host='0.0.0.0', port=8000)
