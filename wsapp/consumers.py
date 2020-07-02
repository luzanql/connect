import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Game, Move, Channel
from django.db import IntegrityError


FIRST_PLAYER = 'X'
SECOND_PLAYER = 'O'
class MoveConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.player = self.scope['url_route']['kwargs']['player']
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_name,
            self.channel_name
        )

        try:
            # Validate player
            if self.player != FIRST_PLAYER and self.player != SECOND_PLAYER:
                print("Player not allowed")
                self.close()
                raise Exception
            is_x_player =  True if self.player == FIRST_PLAYER else False

            self.game = Game.objects.get(name=self.room_name, active='True')
            channels_count = Channel.objects.filter(game=self.game).count()

            if channels_count > 1:
                print('The room is full')
                self.close()
                raise Exception

            if channels_count == 1:
                # Validate if player is already connected
                channel = Channel.objects.get(game=self.game)
                if channel.is_x_player and is_x_player:
                    print(self.player + ' already connected')
                    self.close()
                    raise Exception

            channel = Channel(name=self.channel_name, game=self.game, is_x_player=is_x_player)
            channel.save()

        except Game.DoesNotExist:
            # Create group channel and game
            self.game = Game.objects.create(name=self.room_name, active=True)
            self.channel = Channel.objects.create(name=self.channel_name, game=self.game, is_x_player=is_x_player)
        except Game.DoesNotExist:
            print("Game does not exist")
        except Exception:
            pass

        self.accept()

    def disconnect(self, close_code):
        # Doesn't always get called
        # Leave room group
        print('Leave room group')
        async_to_sync(self.channel_layer.group_discard) (
            self.room_name,
            self.channel_name
        )
        # Delete Group if channel is part of a game,
        # We do not need persist channels and group info
        try:
            channel = Channel.objects.get(name=self.channel_name)
            channel.game.delete()
        except Channel.DoesNotExist:
            pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_name,
            {
                'type': 'game_move',
                'message': text_data_json
            }
        )

    # Receive movement from room group
    def game_move(self, event):
        text_data_json = event['message']
        try:
            row         = int(text_data_json['row']) - 1
            side        = text_data_json['side']
            is_x_player = bool(text_data_json['xIsPlayer'])
            column      = self.game.getYCoordinate(row, side)
            move        = Move(x=row, y=column, is_x_player=is_x_player, game=self.game)
            move.save()
            self.game.validateGame()
            self.send(text_data=json.dumps({
                'row'      : row,
                'column'   : column,
                'xIsNext'  : not is_x_player,
                'winner'   : self.game.winner,
                'gameOver' : self.game.game_over
            }))
        except (ValueError, IntegrityError):
            print('Missing or Wrong data for movement')



class LobbyConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        print("New user entered lobby!")

        self.send(text_data=json.dumps({
            'games': {
                game.id: {
                    'name': game.name,
                    'is_x_present': game.channel_set.filter(is_x_player=True).exists(),
                    'is_o_present': game.channel_set.filter(is_x_player=False).exists(),
                }
                for game in Game.objects.all()
            }
        }))
