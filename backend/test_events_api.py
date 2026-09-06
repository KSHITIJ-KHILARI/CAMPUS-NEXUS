import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000') as client:
        r = await client.post('/api/v1/auth/login', json={'email': 'student@somaiya.edu', 'password': 'demo123'})
        token = r.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get events
        r = await client.get('/api/v1/events', headers=headers)
        events = r.json()
        print(f'Events count: {len(events)}')
        if events:
            event_id = events[0]['id']
            print(f'First event ID: {event_id}')
            
            # Get event details
            r2 = await client.get(f'/api/v1/events/{event_id}', headers=headers)
            print(f'Event details status: {r2.status_code}')
            data = r2.json()
            print(f'Title: {data.get("title")}')
            
            # Register for event
            r3 = await client.post(f'/api/v1/events/{event_id}/register', headers=headers)
            print(f'Register status: {r3.status_code}')
            print(f'Response: {r3.json()}')

asyncio.run(test())
