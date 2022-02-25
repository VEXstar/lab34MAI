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
import {evaluate} from "mathjs";


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
    const toast = useToast();
    const levels = levelFinder(graph, names).sort(comparePairs);

    useEffect(() => {
            if (setData) {
                setData({matrix: matrix, levels: levels})
            }
        },
        [matrix])

    const accordionItems = levels?.map(elem => {
        return prepTable(elem, matrix, (val, i, j, name, size) => {
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
                clone[name][j][i] = (val !== "" ? "1/" : "NaN") + val;
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


const prepTable = (pairObj, matrix, setMatrix) => {
    const lvl = pairObj.level + 1;
    const mat = matrix[pairObj.parent.id];
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