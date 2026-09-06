import requests, json

BASE='http://127.0.0.1:9501/api/v1'
r = requests.post(f'{BASE}/auth/login', json={'email':'student@somaiya.edu','password':'demo123'}, timeout=5)
token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

queries = [
    'Show me todays events',
    'Can I register for the next event',
    'Find my Java course',
    'Which books are available in the library',
    'Is Dr. Priya Sharma free today',
    'Show me the portfolio of a student',
    'Find a free classroom for 10 people',
    'Whats crowded right now',
    'Where is the library',
    'Show me my notifications',
    'Show me my schedule',
    'Are there lost items',
    'What is the campus digital twin',
    'What facilities are open',
]
for q in queries:
    try:
        r = requests.post(f'{BASE}/ai/chat', headers=headers, json={'message':q}, timeout=30)
        resp = r.json()
        print('Q:', q)
        print('A:', resp.get('response','')[:200].encode('ascii', 'ignore').decode('ascii'))
        print('Tools:', resp.get('tools_used',[]))
        print()
    except Exception as e:
        print('Q:', q, 'Error:', e)
        print()
