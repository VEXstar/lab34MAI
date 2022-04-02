import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box, Input,
    Table, useToast,
} from "@chakra-ui/react";
import {getOutgoers} from "react-flow-renderer";
import {useEffect, useState} from "react";
import {evaluate, norm} from "mathjs";


const comparePairs = (a, b) => {
    if (a.level < b.level) {
        return -1;
    }
    if (a.level > b.level) {
        return 1;
    }
    return 0;
}

export const MatrixBuilder = ({graph, names, setData}) => {

    const [matrix, setMatrix] = useState({});
    const [selfVectors, setSelfVector] = useState({});
    const toast = useToast();
    const levels = levelFinder(graph, names).sort(comparePairs);

    useEffect(() => {
            if (setData) {
                setData({matrix: matrix, levels: levels})
            }
            const generatedNames = Object.keys(matrix);
            let calculatedVectors = generatedNames.map(cal=> {
                const oneMat = matrix[cal];
                let vector = {self:[],norm:[]}
                let sum = 0;
                console.log(cal)
                console.table(oneMat);
                for (let i= 0; i <oneMat.length;i++) {
                    let mul = 1;
                    for(let j = 0; j<oneMat.length;j++) {
                        if(oneMat[j][i] !== "NaN") {
                            mul *= evaluate(oneMat[i][j]);
                        }
                    }
                    console.log(i,mul)
                    const x = Math.pow(mul,1/oneMat.length);
                    sum += x;
                    vector.self.push(x);
                }
                vector.self.forEach(elem=>{
                    vector.norm.push(elem/sum)
                });
                return vector;
            });
            let named = {};
            for (let i = 0; i <generatedNames.length;i++) {
                named[generatedNames[i]] = calculatedVectors[i];
            }
            setSelfVector(named);
        },
        [matrix])

    const accordionItems = levels?.map(elem => {
        return prepTable(elem, matrix, selfVectors,(val, i, j, name, size) => {
            let clone = JSON.parse(JSON.stringify(matrix));
            if (!matrix[name] || matrix[name].length !== size) {
                let zeroMatrix = [];
                for (let k = 0; k < size; k++) {
                    zeroMatrix.push([])
                    for (let l = 0; l < size; l++) {
                        zeroMatrix[k].push(1);
                    }
                }
                clone[name] = zeroMatrix;
            }
            if (val === "") {
                toast({
                    position: "top-right",
                    title: `Значение (пусто) в ячейке ${i},${j} является не допустимым`,
                    status: "warning",
                    isClosable: true,
                });
            } else if (val.indexOf("/")==-1&&isNaN(val)) {
                toast({
                    position: "top-right",
                    title: `Значение (${val === "" ? "пусто" : val}) в ячейке ${i},${j} является не допустимым`,
                    status: "error",
                    isClosable: true,
                });
                return;
            } else if(val.slice(-1)!=="/") {
                const forCheck = evaluate(val);
                if (forCheck > 9 || forCheck < 0) {
                    toast({
                        position: "top-right",
                        title: `Значение (${val}) в ячейке ${i},${j} выходит за диапазон от 1 до 9`,
                        status: "error",
                        isClosable: true,
                    });
                    return;
                }
            }
            clone[name][i][j] = val;
            if(val.slice(-1)==="/") {
                clone[name][j][i] = "NaN";
            }
            else if(val.indexOf("/")!==-1) {
                clone[name][j][i] = 1/evaluate(val);
            }
            else if(val=="1") {
                clone[name][j][i] = "1";
            }
            else {
                clone[name][j][i] = val !== "" ? ("1/" + val) : clone[name][j][i];
            }
            setMatrix(clone);
        });
    });
    return (
        <Accordion>
            {accordionItems}
        </Accordion>
    )
}

const levelFinder = (graph, names) => {
    if (!graph || !names) {
        return [];
    }
    let root = {id: "root"};
    let fstLvl = getOutgoers(root, graph);
    let pairs = [];
    root.level = 0;
    root.prettyName = names[root.id] ? names[root.id] : root.id;
    fstLvl.forEach(elem => {
        elem.parent = root;
        recLevelFinder(graph, elem, 1, names, pairs);
    });
    pairs.push({parent: root, pairs: fstLvl, level: 0});
    return pairs;

}
const recLevelFinder = (graph, node, level, names, pairs) => {
    node.level = level;
    node.prettyName = names[node.id] ? names[node.id] : node.id;
    node.prettyName = node.id.indexOf("shadow") !== -1 && node.data?.label ? node.data?.label : node.prettyName;
    let next = getOutgoers(node, graph);
    next.forEach(elem => {
        elem.parent = node;
        recLevelFinder(graph, elem, level + 1, names, pairs);
    });
    if (next.length > 0) {
        pairs.push({parent: node, pairs: next, level: level});
    }

}


const prepTable = (pairObj, matrix, selfVectors,setMatrix) => {
    const lvl = pairObj.level + 1;
    const mat = matrix[pairObj.parent.id];
    const currVectors = selfVectors[pairObj.parent.id];
    return (
        <AccordionItem>
            <h2>
                <AccordionButton>
                    <Box flex='1' textAlign='left'>
                        Уровень {lvl}, сравнение по {pairObj.parent?.prettyName}
                    </Box>
                    <AccordionIcon/>
                </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
                <Table>
                    <thead>
                    <tr>
                        <th>{pairObj.parent?.prettyName}</th>
                        {pairObj.pairs.map(elem => {
                            return (
                                <th>{elem.prettyName}</th>
                            )
                        })}
                        <th style={{borderRight:"solid 1px black"}}>
                            ВСЗ
                        </th>
                        <th>
                            НСЗ
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        pairObj.pairs?.map((elemi, i) => {
                            return (
                                <tr>
                                    <td>{elemi.prettyName}</td>
                                    {
                                        pairObj.pairs?.map((elemj, j) => {
                                            const defVal = mat ? mat[i][j] : 1;
                                            return (
                                                <td>
                                                    <Input disabled={i >= j} value={defVal} variant={"outline"}
                                                           onInput={(target) => {
                                                               setMatrix(target.target.value, i, j, pairObj.parent.id, pairObj.pairs.length)
                                                           }}/>
                                                </td>
                                            )
                                        })
                                    }
                                    <td style={{borderRight:"solid 1px black"}}>
                                        {currVectors&&Math.round(currVectors.self[i] * 100) / 100}
                                    </td>
                                    <td>
                                        {currVectors&&Math.round(currVectors.norm[i] * 100) / 100}
                                    </td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </Table>
            </AccordionPanel>
        </AccordionItem>
    )
}