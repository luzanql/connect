import json
from channels.generic.websocket import WebsocketConsumer
from .models import Game, Move


class MoveConsumer(WebsocketConsumer):
    game = None
    def connect(self):
        self.accept()
        # save by the time of connection
        self.game = Game()
        self.game.save()


    def disconnect(self, close_code):
        pass


    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print(text_data_json)
        row         = int(text_data_json['row']) - 1
        side        = text_data_json['side']
        is_x_player = bool(text_data_json['xIsPlayer'])
        column      = self.game.getYCoordinate(row, side)
        print(self.game.getBoardState())
        print(column)
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