from django.test import SimpleTestCase
from wsapp.models import Game, Move

class TestMovements(SimpleTestCase):

    def setUp(self):
        self.game = Game.objects.create(name='testing', active=True)
        self.move1 = Move.objects.create(self.game, 0, 0, True)
        self.move2 = Move.objects.create(self.game, 1, 0, True)
        self.move3 = Move.objects.create(self.game, 2, 0, True)
        self.move4 = Move.objects.create(self.game, 3, 0, True)
        self.move5 = Move.objects.create(self.game, 4, 0, True)
        self.move6 = Move.objects.create(self.game, 5, 0, True)
        self.move7 = Move.objects.create(self.game, 6, 0, True)

    def tearDown(self):
        del self.game
        del self.move1
        del self.move2
        del self.move3
        del self.move4
        del self.move5
        del self.move6
        del self.move7


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
            self.assertTrue(self.game.is_valid(*move))

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
            self.assertFalse(self.game.is_valid(*move))

