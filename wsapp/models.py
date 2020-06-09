from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

FIRST_PLAYER_MOVE = 'X'
SECOND_PLAYER_MOVE = 'O'
BOARD_SIZE = 7

class Game(models.Model):
    start_time = models.DateTimeField(auto_now_add=True)
    game_over =  models.BooleanField(default=False)
    winner = models.CharField(max_length=1)


    def getBoardState(self):
        board = [[None for x in range(BOARD_SIZE)] for y in range(BOARD_SIZE)]
        for move in self.move_set.all():
            board[move.x][move.y] = FIRST_PLAYER_MOVE if move.is_x_player else SECOND_PLAYER_MOVE
        return board

    def getYCoordinate(self, xMove, side):
        board = self.getBoardState()
        for x, row in enumerate(board):
            if x == xMove:
                if side == 'R':
                    y = BOARD_SIZE - 1
                    for elem in reversed(row):
                        if (elem is None):
                            return y
                        y -= 1
                if side == 'L':
                    for y, elem in enumerate(row):
                        if (elem is None):
                            return y

    def validateLine(self, a, b, c, d):
        return a is not None and a == b and a == c and a == d

    """
    Validate Game Recorriendo si se repite x o y en diagonal, actualizar ganador, game over y status
    """
    def validateGame(self):
        board = self.getBoardState()
        # Horizonal validation
        for i in range(BOARD_SIZE):
            for j in range(4):
                if self.validateLine(board[i][j], board[i][j+1], board[i][j+2], board[i][j+3]):
                    self.winner = board[i][j]
                    self.game_over = True
                    self.save()
                    return
        # Vertical validation
        for j in range(BOARD_SIZE):
            for i in range(4):
                if self.validateLine(board[i][j], board[i+1][j], board[i+2][j], board[i+3][j]):
                    self.winner = board[i][j]
                    self.game_over = True
                    self.save()
                    return
        # Diagonal right validation
        for j in range(3):
            for i in range(4):
                if self.validateLine(board[i][j], board[i+1][j+1], board[i+2][j+2], board[i+3][j+3]):
                    self.winner = board[i][j]
                    self.game_over = True
                    self.save()
                    return

        # Diagonal left validation
        for j in range(4):
            for i in range(3):
                if self.validateLine(board[i][j], board[i-1][j+1], board[i-2][j+2], board[i-3][j+3]):
                    self.winner = board[i][j]
                    self.game_over = True
                    self.save()
                    return


class Move(models.Model):
    x = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(BOARD_SIZE - 1)])
    y =  models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(BOARD_SIZE - 1)])
    is_x_player = models.BooleanField()
    game = models.ForeignKey(Game, on_delete=models.CASCADE)




