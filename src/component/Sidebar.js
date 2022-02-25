import React from 'react';

export default () => {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside>
            <div style={{
                background: '#D6D5E6',
                marginTop:"10px",
                textAlign:"center",
                color: '#333',
                border: '1px solid #222138',
                width: 180,
                height:"30px",
                borderRadius:"5px"
            }} onDragStart={(event) => onDragStart(event, 'default')} draggable>Создать ноду
            </div>
        </aside>
    );
};