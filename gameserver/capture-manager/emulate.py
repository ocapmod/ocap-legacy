import requests

import config


def send_init():
  payload = {'server_id': 'server1'}
  send_request('init', payload)

def send_import():
  payload = {
    'server_id': 'server1',
    'capture_data': {'test_key': 'test_value'}
  }
  send_request('import', payload) 

def send_request(command, payload):
  r = requests.post('http://localhost:{}/{}'.format(config.PORT, command), json=payload)
  print('REMOTE: {}'.format(r.text))

try:
  print('Options:')
  print('  1: Send init')
  print('  2: Send import')
  while True:
    opt = input('Enter option: ')

    if opt == '1':
      send_init()
    elif opt == '2':
      send_import()
except KeyboardInterrupt:
  exit()