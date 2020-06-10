import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var client = null;

function Square(props) {
    return (
        <div className="square">
            {props.value}
        </div>
    );
}

function Row(props) {
    return <div>
    {[...Array(props.squares.length)].map((x, j) =>
        <Square key={j} value={props.squares[j]}></Square>
        )}
    </div>

}
class Board extends React.Component {
    constructor (props){
        super(props);
        this.state = {
            boardState: new Array(7).fill(new Array(7).fill(null)),
            xIsNext: true,
            gameOver: false,
            winner: '',
            xMove: '',
            side: '',
        };

        this.player = props.player;
        this.handleXChange = this.handleXChange.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleRadioButtonSide = this.handleRadioButtonSide.bind(this);
    }
    componentWillMount() {
        if (client) {
            client.onmessage = (message) => {
                const data = JSON.parse(message.data);
                if (!this.state.gameOver) {
                    this.makeMove(data.row, data.column, data.xIsNext, data.winner, data.gameOver);
                }
            };
        }
    }

    handleXChange(event) {
        this.setState({xMove: event.target.value});
    }

    handleYChange(event) {
        this.setState({side: event.target.value});
    }

    handleMove(event) {
        let currPlayer = this.state.xIsNext ? 'X' : 'O';
        if (this.player === currPlayer) {
            client.send(JSON.stringify({
                'row': this.state.xMove,
                'side': this.state.side,
                'xIsPlayer': this.state.xIsNext
            }));
        }
    }

    handleRadioButtonSide(event) {
        this.setState({side: event.target.value});
    }

    makeMove(row, column, xIsNext, winner, gameOver) {

        const boardCopy = this.state.boardState.map(function(arr) {
            return arr.slice();
        });

        boardCopy[row][column] = this.state.xIsNext ? 'X' : 'O';

        this.setState({
            xIsNext: xIsNext,
            boardState: boardCopy,
            winner: winner,
            gameOver: gameOver
        })
    }


    renderBoard() {
        /*Contruct rows allocating column from board*/
        let rows = [...Array(this.state.boardState.length)].map((x, i) =>
        <Row
            key={i}
            squares={this.state.boardState[i]}
        ></Row>
        )
        return rows;
    }

    render() {
        let status;
        if (this.state.winner !== '') {
            status = <label className="custom-label"> Winner:   {this.state.winner}</label>
        } else {
            status = <label className="custom-label">  Next Player:  {this.state.xIsNext ? 'X' : 'O'}</label>
        }
        return(
            <div>
                <div className="status">{status}</div>
                <div className="row">
                    <div className="col-12">{this.renderBoard()}</div>
                </div>
                <div className="row">
                    <div className="col-2">
                    </div>

                    <div className="col-2">
                        <label className="custom-label">Row:</label>
                        <input type="text" className="form-control" onChange={this.handleXChange}/>
                    </div>

                    <div className="col-3">
                        <label className="custom-label">   Side: </label>
                        <div>
                            <input type="radio"  value="R" name="side" onChange={this.handleRadioButtonSide}/> Right
                        </div>
                    </div>
                    <div className="col-3">
                        < label className="custom-label"> </label>
                        <input type="radio" value="L" name="side"  onChange={this.handleRadioButtonSide}/> Left
                    </div>
                    <div className="col-4">
                    </div>
                </div>
                <div className="row">
                    <div className="col-4"></div>
                    <div className="col-6">
                        <button className="btn btn-primary custom-btn" onClick={this.handleMove} >Make move </button>
                    </div>
                    <div className="col-4"></div>
                </div>
            </div>
        )
    }
}

class Game extends React.Component {

    constructor (props){
        super(props);
        this.state = {
            player: '',
            displayBoard: false,
            diplayRoomInfo: true
        };
        this.connectSocket = this.connectSocket.bind(this);
        this.handleRadioButtonPlayer = this.handleRadioButtonPlayer.bind(this);
        this.handleEnterGame = this.handleEnterGame.bind(this);
    }

    handleRadioButtonPlayer(event) {
        this.setState({player: event.target.value});
    }


    connectSocket () {
        client.onopen = () => {
            this.setState({displayBoard: true, diplayRoomInfo: false});
        };

        client.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };
    }


    handleEnterGame(event) {

        client = new WebSocket(
            'ws://'
            +  '127.0.0.1:8000'
            + '/ws/connect_four/'
            +  this.state.player
            + '/');

        this.connectSocket();
    }
    render() {
        let board;
        if (this.state.displayBoard) {
            board = <Board  player={this.state.player}/>;
        }
        let roomInfo;
        if (this.state.diplayRoomInfo) {
            roomInfo =  <div className="container">
                            <div className="row">
                                <div className="col-2">
                                    <label className="custom-label">Room Name:</label>
                                </div>
                                <div className="col-4 input-group">
                                    <input className="form-control" />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-2">
                                    <label className="custom-label"> Player: </label>
                                </div>
                                <div className="col-2">
                                    <label className="player-label" >X </label>
                                    <input type="radio"  value="X" name="player" onChange={this.handleRadioButtonPlayer} />
                                </div>
                                <div className="col-2">
                                    <label className="player-label">O</label>
                                    <input type="radio" value="O" name="player"  onChange={this.handleRadioButtonPlayer}/>
                                </div>
                                <div className="col-8"></div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <button className="btn btn-primary" onClick={this.handleEnterGame} > Enter Game </button>
                            </div>
                        </div>
                        </div>
        }
    return (
        <div className="container">
            <div>
                <div className="row">
                    {roomInfo}
                </div>
            <div className="row">
                {board}
            </div>
            </div>
        </div>
    );
    }
}

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);


