import React, { useEffect, useState} from 'react';
import Canvas from './Canvas';
import './waluty.scss';

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
              break;
            }
            default: throw Error('...');
        }
    }
    const handleSubmit = (ev) => {
        ev.preventDefault();
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
                <Graff table = {table} code = {symbol} startData = {startDate} 
                data = {new Date().toISOString().substr(0, 10)}/>
            </>
        }
        </>
    )
}
function Graff(props){
    const [state, setState] = useState([]);
    const [isLoaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [currency, setCurrency] = useState();

    useEffect(() => {
        fetch(`http://api.nbp.pl/api/exchangerates/rates/${props.table}/${props.code}/${props.startData}/${props.data}/`)
          .then(response => response.json())
          .then(res => {
              setState(res.rates);
              setCurrency(res.currency);
              setLoaded(true); setError(false);
          })
          .catch(err => {
              setLoaded(true);
              setError(err.message);
          });
    }, [props]);

    if (!isLoaded) return <div>Loading...</div>
    else if (error) return <div>{error}</div>;
    
    const WIDTH = 500; const HEIGHT = 370; const gradient = .9;
    let arr = []; let MAX, MIN, maxDay, minDay;

    if (props.table === 'C'){
        MAX = 0; MIN = Infinity;
        maxDay = minDay = state[0].effectiveDate;
        for (let i = 0; i < state.length; i++) {
            let middle = (state[i].ask + state[i].bid) / 2;
            if (middle > MAX) {
                let maxItemLenght = Math.max.call(Math, state[i].ask.toString().length, state[i].bid.toString().length);
                MAX = Number(middle.toFixed(maxItemLenght - 2));
                maxDay = state[i].effectiveDate;
            }
            if (middle < MIN) {
                let maxItemLenght = Math.max.call(Math, state[i].ask.toString().length, state[i].bid.toString().length);
                MIN = Number(middle.toFixed(maxItemLenght - 2));
                minDay = state[i].effectiveDate;
            }
            arr[i] = middle;
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
            ctx.lineWidth = 1; ctx.strokeStyle = 'grey';
            ctx.beginPath();
            ctx.moveTo(0, HEIGHT - yMax);
            ctx.lineTo(WIDTH, HEIGHT - yMax);
            ctx.moveTo(0, HEIGHT - 20);
            ctx.lineTo(WIDTH, HEIGHT - 20);
            ctx.stroke();
            ctx.lineWidth = 8;
            ctx.strokeStyle = "red";
            ctx.moveTo(0, HEIGHT - 20 + (arr[0]-MIN) * gradH * gradient);
            ctx.beginPath();

            for (let i = 0; i < arr.length; i++) {
                x = i * deltaW; y = 20 + (arr[i]-MIN) * gradH * gradient; 
                ctx.lineTo(x, HEIGHT - y);
            }
            ctx.stroke();
    }
    return (
        <>
            
            <Canvas width = {WIDTH} height = {HEIGHT} draw = {draw}>
                
                <div className = 'canvas_header'>
                    <span>{currency}</span>{props.table === 'C' && ' (kurs średni)'}
                </div>
                <div className = 'max'><span>Max:</span> {MAX} (<span>{maxDay}</span>)</div>
                <div className = 'min'><span>Min:</span> {MIN} (<span>{minDay}</span>)</div>
            </Canvas>
        </>
    );
}
function SendFetch(props){
    const [state, setstate] = useState({});
    const [isLoaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    useEffect(() => {
        fetch(`http://api.nbp.pl/api/exchangerates/tables/${props.table}/`)
          .then(response => {
              console.log(response);
              return response.json();
          })
          .then(res => {
              setstate(res[0]);
              setLoaded(true); setError(false);
          })
          .catch(err => {
            setError(err.message);
            setLoaded(true);
          });
    }, [props.table]);
    if (!isLoaded) return <div>Loading...</div>
    else if (error) return <div>{error}</div>;
    if (props.search) {
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