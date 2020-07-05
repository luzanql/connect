from django.test import TestCase
from wsapp.models import Game, Move

class TestMovements(TestCase):

    def setUp(self):
        self.game  = Game.objects.create(name='testing', active=True)
        self.move1 = Move.objects.create(game=self.game, x=0, y=0, is_x_player=True)
        self.move2 = Move.objects.create(game=self.game, x=1, y=0, is_x_player=True)
        self.move3 = Move.objects.create(game=self.game, x=2, y=0, is_x_player=True)
        self.move4 = Move.objects.create(game=self.game, x=3, y=0, is_x_player=True)
        self.move5 = Move.objects.create(game=self.game, x=4, y=0, is_x_player=True)
        self.move6 = Move.objects.create(game=self.game, x=5, y=0, is_x_player=True)
        self.move7 = Move.objects.create(game=self.game, x=6, y=0, is_x_player=True)


    def tearDown(self):
        del self.game

    def test_is_valid_when_valid_move(self):
        valid_moves = [
            (0,1),
            (1,1),
            (2,1),
            (3,1),
            (4,1),
            (5,1),
            (6,1),
            (0,6),
            (1,6),
            (2,6),
            (3,6),
            (4,6),
            (5,6),
            (6,6)
        ]
        for move in valid_moves:
            self.assertTrue(self.game.isValidMove(*move))

    def test_is_valid_when_invalid_move(self):
        invalid_moves = [
            (0,2),
            (1,2),
            (3,2),
            (4,2),
            (5,2),
            (6,2),
            (0,5),
            (1,5),
            (3,5),
            (4,5),
            (5,5),
            (6,5)
        ]
        for move in invalid_moves:
            self.assertFalse(self.game.isValidMove(*move))

