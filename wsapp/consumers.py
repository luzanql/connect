import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Game, Move, Group, Channel
from django.db import IntegrityError


FIRST_PLAYER = 'X'
SECOND_PLAYER = 'O'
class MoveConsumer(WebsocketConsumer):

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'connect_four_%s' % self.room_name
        self.player = self.scope['url_route']['kwargs']['player']
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        try:
            # Validate player
            if self.player != FIRST_PLAYER and self.player != SECOND_PLAYER:
                print("Player not allowed")
                self.close()
                raise Exception
            is_x_player =  True if self.player == FIRST_PLAYER else False

            group = Group.objects.get(name=self.room_group_name, active='True')
            self.game = Game.objects.get(group=group)
            channels_count = Channel.objects.filter(group=group).count()

            if channels_count > 1:
                print('The room is full')
                self.close()
                raise Exception

            if channels_count == 1:
                # Validate if player is already connected
                channel = Channel.objects.get(group=group)
                if channel.is_x_player and is_x_player:
                    print(self.player + ' already connected')
                    self.close()
                    raise Exception

            channel = Channel(name = self.channel_name, group=group, is_x_player=is_x_player)
            channel.save()

        except Group.DoesNotExist:
            # Create group channel and game
            group = Group(name=self.room_group_name, active=True)
            group.save()
            channel = Channel(name = self.channel_name, group=group, is_x_player=is_x_player)
            channel.save()
            self.game = Game(group=group)
            self.game.save()
        except Game.DoesNotExist:
            print("Game does not exist")
        except Exception:
            pass

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        print('Leave room group')
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        # Delete Group if channel is part of a game, don't need conexion info
        try:
            channel = Channel.objects.get(name=self.channel_name)
            channel.group.delete()
        except Channel.DoesNotExist:
            pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
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
            move        = Move(x=row, y=column, is_x_player= is_x_player, game=self.game)
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





