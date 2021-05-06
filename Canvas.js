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

export default Canvas;