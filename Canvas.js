import { useEffect, useRef } from "react";

function Canvas(props){
    const canvasRef = useRef();
    const {draw, ...size} = props;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0,0,canvas.width,canvas.height);
        draw(context);
    });
    
    return <canvas ref = {canvasRef} width = {size.width} height = {size.height}></canvas>
}

export default Canvas;