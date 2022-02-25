import {useEffect, useState} from "react";
import {getOutgoers} from "react-flow-renderer";
import {
    Box,
    Button,
    Collapse,
    Table,
    TableCaption,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useDisclosure
} from "@chakra-ui/react";
import {transpose, evaluate, multiply} from "mathjs";

const getSS = (n) => {
    const std = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
    if ((n - 1) >= std.length) {
        return 1.49;
    }
    return std[n - 1];
}

export const SolutionFinder = ({matrix, levels, graph, altNames}) => {
    const {isOpen, onToggle} = useDisclosure();
    const [solution, setSolution] = useState();
    const [metricMatrix, setMetricMatrix] = useState();
    const calc = () => {
        const vectors = selfVectorFiner(matrix, levels);
        const keys = Object.keys(matrix);
        const metrics = [];
        keys.forEach((elem) => {
            const vector = vectors[elem].selfNormVector;

            const mat = matrix[elem];
            let lambda = 0;
            for (let j = 0; j < mat.length; j++) {
                let sum = 0;
                for (let i = 0; i < mat.length; i++) {
                    sum += evaluate(mat[i][j]);
                }
                lambda += sum * vector[j];
            }
            const ic = (lambda - mat.length) / (mat.length - 1);
            const os = ic / getSS(mat.length) * 100;
            const level = levels.filter(lvl => lvl.parent.id == elem)[0];
            metrics.push({prettyName: level.parent.prettyName, lvl: level.level, is: ic, os: os, lambda: lambda});
        });
        setMetricMatrix(metrics);
        setSolution(findSolution(graph, vectors, levels));
    }

    const decoSolution = solution && solution.map((elem, i) => {
        return {name: altNames[i], val: elem}
    }).sort((a, b) => {
        if (a.val > b.val) {
            return -1;
        }
        if (a.val < b.val) {
            return 1;
        }
        return 0;
    }).map(elem => {
        return (
            <Tr>
                <Td>
                    {elem.name}
                </Td>
                <Td>
                    {elem.val}
                </Td>
            </Tr>
        )
    })

    const decoMetric = metricMatrix && metricMatrix.map(elem => {
        return (
            <Tr>
                <Td>{elem.prettyName}</Td>
                <Td>{elem.lvl + 1}</Td>
                <Td>{elem.lambda?.toFixed(2)}</Td>
                <Td>{elem.is?.toFixed(2)}</Td>
                <Td>{elem.os?.toFixed(2)}</Td>
            </Tr>
        )
    })

    useEffect(() => {
        if (!isOpen && solution) {
            onToggle();
        }
    }, [solution])

    return (
        <>
            <Button
                w={"100%"}
                mt={"10px"}
                mb={"10px"}
                variant={"ghost"}
                onClick={() => {
                    if (isOpen) {
                        onToggle();
                    }
                    calc()
                }}>Вычислить</Button>
            <Collapse in={isOpen} animateOpacity>
                <Box
                    p='4px'
                    mt='4'
                    rounded='3px'
                    bg={"lavender"}
                    shadow='md'
                >
                    <Table variant='simple'>
                        <TableCaption>Метрики уровней</TableCaption>
                        <Thead>
                            <Tr>
                                <Th>Критерий</Th>
                                <Th>Уровень</Th>
                                <Th>Макс. соб. число</Th>
                                <Th>ИС</Th>
                                <Th>ОС</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {decoMetric}
                        </Tbody>
                    </Table>
                    <Table variant='simple'>
                        <TableCaption>Результат</TableCaption>
                        <Thead>
                            <Tr>
                                <Th>Альтернатива</Th>
                                <Th>Обобщенные приоритеты</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {decoSolution}
                        </Tbody>
                    </Table>
                </Box>
            </Collapse>
        </>
    )
}

const getChildsIdByNode = (nodeId, levels) => {
    const list = levels.filter(elem => elem.parent.id === nodeId);
    if (list.length == 0) {
        return [];
    }
    return list[0].pairs.map(elem => {
        return elem.id
    })
}

const findSolution = (graph, vectors, levels) => {
    const root = {id: "root"};
    const rootChilds = getOutgoers(root, graph);
    let matrixOfVectors = []
    let matrixRaw = {}
    rootChilds.forEach(child => {
        matrixRaw[child.id] = recFindSolution(child, graph, vectors, levels).vector;
    });
    const pairs = getChildsIdByNode("root", levels)
    for (let i = 0; i < pairs.length; i++) {
        matrixOfVectors[i] = matrixRaw[pairs[i]]
    }
    matrixOfVectors = transpose(matrixOfVectors)
    const curVector = vectors[root.id].selfNormVector;
    return multiplyMatrices(matrixOfVectors, curVector)
}
const recFindSolution = (node, graph, vectors, levels) => {
    const childs = getOutgoers(node, graph);
    let stop = false;
    let matrixOfVectors = []
    let matrixRaw = {}
    childs.forEach(child => {
        const result = recFindSolution(child, graph, vectors, levels);
        if (stop) {
            return;
        }
        stop = result.type == "leaf";
        matrixRaw[child.id] = result.vector;

    });
    if (childs.length === 0) {
        return {type: "leaf"}
    } else if (stop) {
        return {type: "last", vector: vectors[node.id].selfNormVector}
    }
    const pairs = getChildsIdByNode(node.id, levels);
    for (let i = 0; i < pairs.length; i++) {
        matrixOfVectors[i] = matrixRaw[pairs[i]]
    }
    matrixOfVectors = transpose(matrixOfVectors)
    let result = {type: "node", vector: []}
    const curVector = transpose(vectors[node.id].selfNormVector);
    result.vector = multiplyMatrices(matrixOfVectors, curVector)
    return result;
}

const multiplyMatrices = (m1, m2) => {
    return multiply(m1, m2);
}

const getSelfVector = (mat) => {
    let vector = [];
    for (let i = 0; i < mat.length; i++) {
        let res = 1;
        for (let j = 0; j < mat.length; j++) {
            res *= Math.pow(evaluate(mat[i][j]), 1 / mat.length);
        }
        vector.push(res);
    }
    const sum = vector.reduce((partialSum, a) => partialSum + a, 0);
    let normVector = [];
    vector.forEach((elem, i) => {
        normVector.push(vector[i] / sum);
    });
    return {selfVector: vector, selfNormVector: normVector};
}

const selfVectorFiner = (matrix, levels) => {
    let vectors = {};
    levels.forEach(elem => {
        const nodeMatrix = matrix[elem.parent.id]
        const selfVector = getSelfVector(nodeMatrix);
        vectors[elem.parent.id] = selfVector;
    });
    return vectors;

}