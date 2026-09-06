import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000') as client:
        r = await client.post('/api/v1/auth/login', json={'email': 'student@somaiya.edu', 'password': 'demo123'})
        token = r.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test the faculty directory endpoint
        r = await client.get('/api/v1/faculty/availability/all', headers=headers)
        print(f'/availability/all Status: {r.status_code}')
        data = r.json()
        print(f'Count: {len(data)}')
        for fac in data:
            name = fac.get('name') or fac.get('faculty_name') or 'Unknown'
            print(f'  - {name}')

asyncio.run(test())
