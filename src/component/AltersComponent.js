import {Box, Button, HStack, IconButton, Input} from "@chakra-ui/react";
import {AddIcon, CloseIcon} from "@chakra-ui/icons";
import {useEffect, useState} from "react";


export const AltersComponent = ({setUpAlters}) => {
    const [alters, setAlters] = useState(["Альтернатива 1"]);

    useEffect(()=>{
        setUpAlters(alters)
    },[alters]);

    const mappedAlters = alters.map((value,i) => {
        return (
            <HStack>
                <Input
                    placeholder='Альтернатива'
                    size='sm'
                    key={i}
                    mt={"3px"}
                    defaultValue={value}
                    onInput={(event)=>{
                        let clone = JSON.parse(JSON.stringify(alters));
                        clone[i] = event.target.value;
                        setAlters(clone);
                    }}
                />
                <IconButton size={"sm"} aria-label={"удалить"} onClick={()=>{
                    let clone = JSON.parse(JSON.stringify(alters));
                    clone.splice(i, 1);
                    setAlters(clone);
                }} icon={<CloseIcon/>}/>
            </HStack>
        )
    })
    return (
        <Box>
            {mappedAlters}
            <Button
                w={"100%"} mt={"3px"}
                onClick={()=>{
                    let clone = JSON.parse(JSON.stringify(alters));
                    clone[clone.length] = "Альтернатива " + (clone.length+1);
                    setAlters(clone);
                }}
                size='sm' leftIcon={<AddIcon/>} colorScheme='teal' variant='solid'>
                Добавить Альтернативу
            </Button>
        </Box>
    )
}