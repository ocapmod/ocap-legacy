import json
import requests

import config


def send_init(server_id):
  payload = {'server_id': server_id}
  send_request('init', payload)

def send_import(server_id):
  payload = json.load(open('emulate.json'))
  payload['serverId'] = server_id
  send_request('import', payload)

def send_request(command, payload):
  try:
    r = requests.post('http://localhost:{}/{}'.format(config.PORT, command), json=payload)
    print('REMOTE: {}'.format(r.text))
  except requests.RequestException as error:
    print(error)

try:
  setup_ran = False
  while True:
    if not setup_ran:
      server_id = input('Enter name of server you wish to emulate: ')
      setup_ran = True
      print('Options:')
      print('  0: Start again')
      print('  1: Send init')
      print('  2: Send import')

    opt = input('Enter option: ')
    if opt == '0':
      setup_ran = False
    elif opt == '1':
      send_init(server_id)
    elif opt == '2':
      send_import(server_id)
    else:
      print('Invalid option')
except KeyboardInterrupt:
  exit()