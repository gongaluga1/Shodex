import React from 'react';
import {useEffect, useState} from "react";
import '../Styles/Catalog.css';
import {TypeMap} from "./TypeMap.ts";
import InfiniteScroll from "react-infinite-scroll-component";
function Catalog({typeCoverage}:any){
    const [hasMore, setHasMore] = useState(true);
    const [dataSource, setDataSource] = useState<string[]>([]);
    const [offset, setOffset] = useState(0);
    const [pkmList, setPkmList] = useState<string[]>([]);
    const [ranking, setRanking] = useState<number[]>([]);
    const limit = 1000000000000000;


    const fetchMoreData = async () => {
        //API call
        let tmpList: Array<string> = [];
        for(let i = offset; i < offset+10; i++){
            tmpList.push(pkmList[i]);
        }
        setDataSource(prev => [...prev, ...tmpList]);
        setOffset(prev => prev + 10);
    }

    const fetchData = async () => {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        const names = data.results.map(
            (pokemon: { name: string }) => pokemon.name
        );

        const resultSmogon = await fetch(`https://pkmn.github.io/smogon/data/stats/gen9ou.json`);
        const json = await resultSmogon.json();
            const newRanking: number[] = [];
            for(let i = 0; i < names.length; i++) {
                try{
                    const curTypes = await fetchType(names[i]);
                    let multiplier = 1
                    for(let j=0; j<curTypes.length; j++){
                        multiplier += typeCoverage[TypeMap[curTypes[j]]];
                    }
                    multiplier = 1/multiplier;
                    newRanking.push(Math.round(json.pokemon[capitalizeFirstLetter(names[i])].usage.raw * json.battles*multiplier));
                }catch(e){
                    newRanking.push(0)
                }
            }
            sortRank(names, newRanking);

    }

    const fetchType:(name: string) => Promise<string[]> = async(name:string) => {
        const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.replaceAll(' ', '-')}`);
        //pokeapi data
        const json = await result.json();
        const tmpType: string[] = [];
        for (let i = 0; i < json.types.length; i++) {
            tmpType.push(json.types[i].type.name);
        }
        return tmpType;
    }

    function capitalizeFirstLetter(str:string) {
        //Capitalize letters for api call
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function sortRank(curNames:string[], curRanking:number[]){
        interface PokemonData {
            name: string;
            rank: number;
        }

        function mergeSort(array: PokemonData[]): PokemonData[] {
            if (array.length <= 1) return array;

            const mid = Math.floor(array.length / 2);
            const left = array.slice(0, mid);
            const right = array.slice(mid);

            return merge(mergeSort(left), mergeSort(right));
        }

        function merge(left: PokemonData[], right: PokemonData[]): PokemonData[] {
            let result: PokemonData[] = [];
            let leftIndex = 0;
            let rightIndex = 0;

            while (leftIndex < left.length && rightIndex < right.length) {
                // Change '>' to '<' for ascending order
                if (left[leftIndex].rank > right[rightIndex].rank) {
                    result.push(left[leftIndex]);
                    leftIndex++;
                } else {
                    result.push(right[rightIndex]);
                    rightIndex++;
                }
            }

            return [...result, ...left.slice(leftIndex), ...right.slice(rightIndex)];
        }

        const combinedData = curNames.map((name, index) => ({
            name: name,
            rank: curRanking[index]
        }));

        const sortedData = mergeSort(combinedData);

        setDataSource(sortedData.map(p => p.name).slice(0, 10));
        setPkmList(sortedData.map(p => p.name));
        setRanking(sortedData.map(p => p.rank));
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if(pkmList.length != 0){
            fetchMoreData();
        }
    }, [pkmList]);

    const [isCalculating, setIsCalculating] = useState(false);
    const handleSortClick = async () => {
        setIsCalculating(true); // Start Loading
        try {
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCalculating(false); // Stop Loading (even if it fails)
        }
    };

    return(
        <div className="catalog-container">
            <h2>Catalog</h2>

            <InfiniteScroll
                dataLength={dataSource.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={<p>Loading...</p>}
                endMessage={<p>End of List</p>}
                height={500}
            >
                {dataSource.map((name,index)=>{
                    // @ts-ignore
                    return <div className="item-style" key={index}>{index+1}. {capitalizeFirstLetter(name)} Score: {ranking[index]}</div>
                })}
            </InfiniteScroll>
            <button onClick={handleSortClick}>{isCalculating ? "Processing..." : "Sort Viability"}</button>
        </div>
    )
}
export default Catalog;