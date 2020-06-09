import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


const client = new WebSocket(
    'ws://'
    +  '127.0.0.1:8000'
    + '/ws/connect_four/'
    + 'playnow'
    + '/');

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
            side: ''
        };

        this.connectSocket = this.connectSocket.bind(this);
        this.handleXChange = this.handleXChange.bind(this);
        this.handleYChange = this.handleYChange.bind(this);
        this.handleMove = this.handleMove.bind(this);
    }

    componentWillMount() {
        this.connectSocket();
    }

    connectSocket () {
        client.onopen = () => {
            console.log('WebSocket Client Connected');
        };

        client.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log(data);
            if (!this.state.gameOver) {
                this.makeMove(data.row, data.column, data.xIsNext, data.winner, data.gameOver);
            }
        };

        client.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };
    }

    handleXChange(event) {
        this.setState({xMove: event.target.value});
    }

    handleYChange(event) {
        this.setState({side: event.target.value});
    }

    handleMove(event) {

        client.send(JSON.stringify({
            'row': this.state.xMove,
            'side': this.state.side,
            'xIsPlayer': this.state.xIsNext
        }));
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
            status = 'Winner: ' + this.state.winner;
        } else {
            status = 'Next Player: ' + (this.state.xIsNext ? 'X' : 'O')
        }
        return(
            <div>
                <div className="status">{status}</div>
                <div className="game">
                    <div className="game-board">{this.renderBoard()}</div>
                    <div className="game-info">
                        <label>
                            X:
                            <input type="text" onChange={this.handleXChange}/>
                            Side:
                            <input type="text" onChange={this.handleYChange}/>
                        </label>
                        <button onClick={this.handleMove}  >Play </button>
                    </div>
                </div>
            </div>
        )
    }
}

class Game extends React.Component {
    render() {
    return (
        <div >
            <div>
                <Board />
            </div>
        <div >
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