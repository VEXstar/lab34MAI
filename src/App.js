import './App.css';
import OverviewFlow from "./component/OverviewFlow";
import {ChakraProvider, Heading, Tab, TabList, TabPanel, TabPanels, Tabs} from "@chakra-ui/react";
import {AltersComponent} from "./component/AltersComponent";
import {useState} from "react";
import {MatrixBuilder} from "./component/MatrixBuilder";
import {SolutionFinder} from "./component/SolutionFinder";

function App() {
    const [alts, setAlts] = useState();
    const [data, setData] = useState();
    const [preapredData,setPreparedData] = useState();
    return (
        <ChakraProvider>
            <Heading mt={"10px"} as='h2' size='md'>
                Выполнили студенты группы АГ-101М: Ахметшин Аскар, Минеева Екатерина, Набиева Алина
            </Heading>
            <Tabs mt={"10px"} variant='enclosed' colorScheme='green'>
                <TabList>
                    <Tab>1. Альтеранитвы</Tab>
                    <Tab>2. Граф</Tab>
                    <Tab>3. Матрицы парных сравнений</Tab>
                    <Tab>4. Решение</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <AltersComponent setUpAlters={setAlts}/>
                    </TabPanel>
                    <TabPanel>
                        <OverviewFlow alts={alts} update={(a, b) => {
                            setData({graph: a, names: b});
                        }}/>
                    </TabPanel>
                    <TabPanel>
                        <MatrixBuilder setData={setPreparedData} graph={data?.graph} names={data?.names}/>
                    </TabPanel>
                    <TabPanel>
                       <SolutionFinder altNames={alts} matrix={preapredData?.matrix} levels={preapredData?.levels} graph={data?.graph}/>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </ChakraProvider>
    );
}

export default App;
