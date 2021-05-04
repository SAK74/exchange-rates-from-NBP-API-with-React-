import { useEffect, useRef } from "react";

function Canvas(props){
    const canvasRef = useRef();
    const {draw, ...rest} = props;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0,0,canvas.width,canvas.height);
        draw(context);
    });
    
    return <canvas ref = {canvasRef} width = {rest.width} height = {rest.height}></canvas>
}

function Main(){
    function draw(ctx){
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.lineTo(150, 120);
        ctx.lineTo(100,80);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.rect(0,0,50,150);
        ctx.strokeRect(0,0,120,80);
        ctx.stroke();
        console.log(ctx.canvas.width, ctx.canvas.height);
    }
    return <Canvas width = {500} height = {350} draw = {draw}/>;
}
export default Canvas;