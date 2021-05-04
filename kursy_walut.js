import React, { useEffect, useState } from 'react';
import Canvas from './Canvas';
import './waluty.css';

export default function Main() {
    const [table, setTable] = useState('C');
    const [symbol, setSymbol] = useState('');
    const [startDate, setStartDate] = useState('');

    const handleChange = (ev) => {
        switch(ev.target.id){
            case 'table' : setTable(ev.target.value); setSymbol(''); setStartDate(''); break;
            case 'input' : setSymbol(ev.target.value); break;
            case 'data' : {let delta; const today = new Date().getTime(); 
              switch(ev.target.value){
                case '3days' : delta = 3 * 24 * 3600 * 1000; break;
                case 'week' : delta = 7 * 24 * 3600 * 1000; break;
                case 'month' : delta = 30 * 24 * 3600 * 1000; break;
                case '3month' : delta = 3 * 30 * 24 * 3600 * 1000; break;
                default : setStartDate(''); return;
              }
              setStartDate(new Date(today - delta).toISOString().substr(0, 10));
            }
        }
    }
    const handleSubmit = (ev) => {
        ev.preventDefault();
        alert('Submit!');
    }
    return(
        <>
        <form onSubmit = {handleSubmit} name = 'main'>
            <label htmlFor = 'table'>Wybierz tabelę: </label>
            <select onChange = {handleChange} value = {table} id = 'table'>
                <option value = 'A'>Tabela A kursów średnich walut obcych</option>
                <option value = 'B'>Tabela B kursów średnich walut obcych</option>
                <option value = 'C'>Tabela C kursów kupna i sprzedaży walut obcych</option>
            </select><br/><br/>
            <label htmlFor = 'input'>Wprowadź walutę: </label>
            <input value = {symbol} list = 'waluta' onChange = {handleChange} id = 'input' spellCheck = 'false'/>
            <datalist id = 'waluta'>
                <SendFetch searchText = {symbol} table = {table} search/>
            </datalist>
            {/[A-Z]{3}/.test(symbol) && 
              <>
                <label htmlFor = 'data'>Wybierz okres: </label>
                <select id = 'data' onChange = {handleChange}>
                    <option></option>
                    <option value = '3days'>3 dni</option>
                    <option value = 'week'>tydzień</option>
                    <option value = 'month'>miesiąc</option>
                    <option value = '3month'>3 miesiące</option>
                </select>
              </>
            }
        </form>
        <div>{}</div>
        <SendFetch code = {symbol} table = {table} date = {startDate}/>
        {startDate && 
            <>
                {/* <canvas id = 'canvas'></canvas> */}
                <Wykres table = {table} code = {symbol} startData = {startDate} 
                data = {new Date().toISOString().substr(0, 10)}/>
            </>
        }
        </>
    )
}
function Wykres(props){
    const [state, setState] = useState([]);
    const [isLoaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    useEffect(() => {
        fetch(`http://api.nbp.pl/api/exchangerates/rates/${props.table}/${props.code}/${props.startData}/${props.data}/`)
          .then(response => response.json())
          .then(res => {
              console.log(res.rates);
              setState(res.rates);
              setLoaded(true); setError(false);
          })
          .catch(err => {
              setLoaded(true);
              setError(err.message);
          });
    }, [props.code, props.startData]);
    if (!isLoaded) return <div>Loading...</div>
    else if (error) return <div>{error}</div>;

    const WIDTH =  600; const HEIGHT = 400; const gradient = .9;
    let arr = []; let MAX, MIN, maxDay, minDay;
    
    if (props.table === 'C'){
        MAX = 0; MIN = Infinity;
        maxDay = minDay = state[0].effectiveDate;
        // let midleLenght = 0;
        for (let i = 0; i < state.length; i++) {
            let middle = (state[i].ask + state[i].bid) / 2;
            let maxItemLenght = Math.max.call(Math, state[i].ask.toString().length, state[i].bid.toString().length);
            console.log(maxItemLenght);
            // if (maxItemLenght > midleLenght) midleLenght = maxItemLenght;
            if (middle > MAX) {
                MAX = Number(middle.toFixed(maxItemLenght - 2));
                maxDay = state[i].effectiveDate;
                console.log('MAX: ' + MAX);
            }
            if (middle < MIN) {
                MIN = Number(middle.toFixed(maxItemLenght - 2));
                minDay = state[i].effectiveDate;
            }
            arr[i] = (state[i].ask + state[i].bid) / 2 ;
            console.log('MAX: ' + MAX);

        }
    } else {
        for (let i = 0; i < state.length; i++) {
            arr[i] = state[i].mid;
        }
        MAX = Math.max.apply(Math, arr); 
        MIN = Math.min.apply(Math, arr);

        let i = 0;
        while (state[i].mid !== MAX) {
            i++;
        }
        maxDay = state[i].effectiveDate; 
        i = 0;
        while (state[i].mid !== MIN) {
            i++;
        }
        minDay = state[i].effectiveDate; 
    }

    function draw(ctx){

        let x,y;
        const deltaW = (WIDTH)/state.length; const gradH = HEIGHT/(MAX-MIN);

        const yMax = 20 + (MAX-MIN) * gradH * gradient; 
        //console.log(max, MIN, yMax);
            ctx.lineWidth = 1; ctx.strokeStyle = 'grey';
            ctx.beginPath();
            ctx.moveTo(0, HEIGHT - yMax);

            ctx.lineTo(WIDTH, HEIGHT - yMax);
            ctx.moveTo(0, HEIGHT - 20);
            ctx.lineTo(WIDTH, HEIGHT - 20);
            ctx.stroke();
            ctx.lineWidth = 8;  // ?????
            ctx.strokeStyle = "red";
            ctx.moveTo(0, HEIGHT - 20 + (arr[0]-MIN) * gradH * gradient);
            ctx.beginPath();

            for (let i = 0; i < arr.length; i++) {
                //console.log(arr[i]);
                x = i * deltaW; y = 20 + (arr[i]-MIN) * gradH * gradient; 
                //console.log('x: ' + x + ' y: ' + y);
                ctx.lineTo(x, HEIGHT - y);
                //ctx.fillRect(20 + x-WEIGHT/2, HEIGHT-y, WEIGHT, y);
            }
            ctx.stroke();      
    }
    return (
        <>
            {props.table === 'C' && <div className = 'graffCapt'>Kurs Średni</div>}
            <Canvas width = {WIDTH} height = {HEIGHT} draw = {draw}/>
            <div className = 'max'><span>Max:</span> {MAX} (<span className = 'span'>{maxDay}</span>)</div>
            <div className = 'min'><span>Min:</span> {MIN} (<span className = 'span'>{minDay}</span>)</div>
        </>
    );
}
function SendFetch(props){
    const [state, setstate] = useState({});
    const [isLoaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    useEffect(() => {
        fetch(`http://api.nbp.pl/api/exchangerates/tables/${props.table}/`)
          .then(response => response.json())
          .then(res => {
              //console.log(res);
              setstate(res[0]);
              setLoaded(true); setError(false);
          })
          .catch(err => {
              setLoaded(true);
              setError(err.message);
          });
    }, [props.table]);
    if (!isLoaded) return <div>Loading...</div>
    else if (error) return <div>{error}</div>;
    //console.log(state.rates);
    if (props.search) {
        if (props.searchText === 'x') return null;
        let opcje = [];
        state.rates.forEach(element => {
            if (element.currency.indexOf(props.searchText) === -1 && element.code.indexOf(props.searchText) === -1) return;
            opcje.push(<option key = {element.code} value = {element.code}>{element.currency}</option>);
        });
        return opcje;
    } 
    return(
        <>
        <h1>Hi!</h1>
        <table border = '1'>
            <caption>Kursy walut z dnia {state.effectiveDate}</caption>
            <thead>
                <tr>
                    <th>Waluta</th>
                    <th>Kod</th>
                    <th>{props.table !== 'C' ? 'Średni kurs' : 'Kupno'}</th>
                    {props.table === 'C' && <th>Sprzedaż</th>}
                </tr>
            </thead>
            <tbody>
                {state.rates.map(val => (
                    <tr className = {((val.code === props.code) && 'selected').toString()} key = {val.code}>
                        <td>{val.currency}</td>
                        <td>{val.code}</td>
                        <td>{props.table === 'C' ? val.bid : val.mid}</td>
                        {props.table === 'C' && <td>{val.ask}</td>}
                    </tr>
                ))}
            </tbody>
        </table>
        </>
    )
}