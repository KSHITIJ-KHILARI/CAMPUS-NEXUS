import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000') as client:
        r = await client.post('/api/v1/auth/login', json={'email': 'student@somaiya.edu', 'password': 'demo123'})
        token = r.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        r = await client.get('/api/v1/library/books', headers=headers)
        for book in r.json():
            print(f"{book['id']}: {book['title']} - avail: {book['available_copies']}")

asyncio.run(test())
