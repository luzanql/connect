import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const Square = (props) =>
        <button className="square"  onClick={() => props.onClick()} > {props.value}
        </button>

const Row = (props) =>
    <div className="row">
        {[...Array(props.squares.length)].map((x, j) =>
            <Square key={j} value={props.squares[j]} onClick={() => props.onClick(props.row, j) } >
            </Square>
        )}
    </div>


class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boardState: new Array(7).fill(new Array(7).fill(null)),
            xIsNext: true,
            gameOver: false,
            winner: '',
            xMove: '',
            side: '',
        };
        this.client = null;
        this.player = props.player;
        this.handleXChange = this.handleXChange.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleRadioButtonSide = this.handleRadioButtonSide.bind(this);
        this.handleSquareClick = this.handleSquareClick.bind(this);
    }

    componentWillMount() {
        this.client = new WebSocket(
            `ws://127.0.0.1:8000/ws/game/${this.props.roomName}/${this.player}/`
        );

        this.client.onopen = () => {
            console.log('game socket connected!');
        };
        this.client.onclose = function(e) {
            console.error('game socket disconnected!');
        };
        this.client.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (!this.state.gameOver) {
                this.makeMove(data.row, data.column, data.xIsNext, data.winner, data.gameOver);
            }
        };
    }
    handleSquareClick(row, column){
        this.setState({xMove: column});
        this.setState({side: row});
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
            this.client.send(JSON.stringify({
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
        return [...Array(this.state.boardState.length)].map((x, i) =>
            <Row
                key={i}
                squares={this.state.boardState[i]}
                row={i}
                onClick={this.handleSquareClick}
            ></Row>
        )
    }

    render() {
        let status;
        if (this.state.winner !== '') {
            status = <label className="custom-label"> Winner: {this.state.winner}</label>
        } else {
            status = <label className="custom-label"> Next Player: {this.state.xIsNext ? 'X' : 'O'}</label>
        }
        return(
            <div className="container">
                <div className="status"><label className="custom-label"> You are: {this.player} </label> </div>
                <div className="status">{status}</div>
                <div className="row">
                    <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">{this.renderBoard()}</div>
                </div>
                <div className="row">
                    <div className="col-lg-6 col-md-6 col-xs-12">
                        <div className="row">
                            <div className="col-2"><span className="my-span">Row:</span>
                                <input type="text" className="form-control" onChange={this.handleXChange}/>
                            </div>
                            <div className="col-2">
                                <span className="my-span">Left:</span>
                                <input type="radio" value="L" name="side"  onChange={this.handleRadioButtonSide}/>
                            </div>
                            <div className="col-2">
                                <span className="my-span">Right:</span>
                                <input type="radio"  value="R" name="side" onChange={this.handleRadioButtonSide}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <button className="btn btn-primary custom-btn" onClick={this.handleMove}>Make move</button>
                    </div>
                </div>
            </div>
        )
    }
}

class Lobby extends React.Component {
    constructor(props) {
        super(props);
        this.client = null;
        this.state = {
            games: {},
            newRoomName: '',
            player: 'X',
            roomName: null,
        };
    }

    componentDidMount() {
        this.client = new WebSocket('ws://127.0.0.1:8000/ws/lobby/');
        this.client.onopen = () => {
            console.log('lobby socket connected!');
            this.setState({displayBoard: true, diplayRoomInfo: false});
        };
        this.client.onclose = function(e) {
            console.error('lobby socket disconnected!');
        };

        this.client.onmessage = (message) => {
            const { games } = JSON.parse(message.data)
            console.log('Got games list', games);
            this.setState({games});
        };
    }

    handleRadioButtonPlayer(player) {
        this.setState({player})
        return true
    }

    handleNewRoomName(newRoomName) {
        this.setState({newRoomName})
        return true
    }

    handleEnterGame(roomName, player) {
        this.setState({ roomName, player })
        return true
    }

    render() {
        if (this.state.roomName) {
            return <Board roomName={this.state.roomName} player={this.state.player}/>;
        } else {
            return (
                <div className="container">
                    <div className="row">
                        <h1>Connect-Four Lobby</h1>
                    </div>
                    <div>
                        <div className="row">
                            {Object.entries(this.state.games).map(([game_id, { name, is_x_present, is_o_present }], idx) =>
                                <div onClick={() => (is_x_present && is_o_present) ? alert('room is full!') : this.handleEnterGame(name, is_x_present ? 'O' : 'X')}>
                                    <h3>#{idx}: {name}</h3>
                                    {[is_x_present, is_o_present].filter(p => p).length} players<br/>
                                    <small>ID: {game_id}</small>
                                </div>)}
                        </div>
                        <div className="row">
                            <div className="row">
                                <div className="col-2">
                                    <label className="custom-label">New Room Name:</label>
                                </div>
                                <div className="col-4 input-group">
                                    <input className="form-control" onChange={(event) => this.handleNewRoomName(event.target.value)} value={this.state.newRoomName}/>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-2">
                                    <label className="custom-label"> Player: </label>
                                </div>
                                <div className="col-2">
                                    <label className="player-label"> X </label>
                                    <input type="radio" value="X" name="player" onChange={(event) => this.handleRadioButtonPlayer(event.target.value)} />
                                </div>
                                <div className="col-2">
                                    <label className="player-label">O</label>
                                    <input type="radio" value="O" name="player" onChange={(event) => this.handleRadioButtonPlayer(event.target.value)}/>
                                </div>
                                <div className="col-8"></div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <button className="btn btn-primary" onClick={(event) => this.handleEnterGame(this.state.newRoomName, this.state.player)}> Enter Game </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

// ========================================
ReactDOM.render(
    <Lobby />,
    document.getElementById('root')
);


