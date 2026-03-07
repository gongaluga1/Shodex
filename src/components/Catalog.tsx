import React from 'react';
import {useEffect, useState} from "react";
import '../Styles/Catalog.css';
import {TypeMap} from "./TypeMap.ts";
import InfiniteScroll from "react-infinite-scroll-component";

function Catalog({typeCoverage}:any){
    /*Setting constants, mostly state variables*/
    const [hasMore, setHasMore] = useState(true);
    const [dataSource, setDataSource] = useState<string[]>([]);
    const [offset, setOffset] = useState(0); //Offset of Pokemon importing when lazy loading
    const [pkmList, setPkmList] = useState<string[]>([]); //pkmList and ranking are parallel arrays
    const [ranking, setRanking] = useState<number[]>([]); //Stores the rank of the Pokemon at that index
    const limit = 1000000000000000; //Mandatory limit for Smogon's api, set really high to import all Pokemon

    //Main data fetching function
    const fetchData = async () => {
        //Get the json from pokeapi
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        //Get json from Smogon
        const resultSmogon = await fetch(`https://pkmn.github.io/smogon/data/stats/gen9ou.json`);
        const json = await resultSmogon.json();

        //Names of every Pokemon
        const names = data.results.map(
            (pokemon: { name: string }) => pokemon.name
        );

        //Remakes ranking as the function is called when sorting the rankings
        const newRanking: number[] = [];
        //Loops through every Pokemon and calculates its rank
        for(let i = 0; i < names.length; i++) {
            try{
                const curTypes = await fetchType(names[i]);
                let multiplier = 1
                //For each time the current Pokemon's type is repeated in the team, multiplier is incremented
                for(let j=0; j<curTypes.length; j++){
                    multiplier += typeCoverage[TypeMap[curTypes[j]]];
                }
                multiplier = 1/multiplier; //The usage is multiplied by reocurring types to decrease score
                newRanking.push(Math.round(json.pokemon[capitalizeFirstLetter(names[i])].usage.raw * json.battles*multiplier));
            }catch(e){
                newRanking.push(0) //If the Pokemon has no data, it's rank is automatically 0
            }
        }
        sortRank(names, newRanking); //Merge sort the ranks

    }

    //Fetching data method for lazy loading
    const fetchMoreData = async () => {
        //Retreives 10 more Pokemon from pkmList
        const tmpList: Array<string> = [];
        for(let i = offset; i < offset+10; i++){
            tmpList.push(pkmList[i]);
        }
        setDataSource(prev => [...prev, ...tmpList]); //Concatenates old and new list
        setOffset(prev => prev + 10); //Increases offset
    }

    //Type of the Pokemon entered, needed as Smogon api does NOT provide type
    const fetchType:(name: string) => Promise<string[]> = async(name:string) => {
        //Pokeapi call
        const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.replaceAll(' ', '-')}`);
        const json = await result.json();

        //Puts types into a list, then returns
        const tmpType: string[] = [];
        for (let i = 0; i < json.types.length; i++) {
            tmpType.push(json.types[i].type.name);
        }
        return tmpType;
    }

    //Capitalizes the first letter in accordance to Smogon's api formatting
    //Also used in UI to display capital names
    function capitalizeFirstLetter(str:string) {
        return str.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');
    }

    //Merge sorting rank
    function sortRank(names:string[], curRanking:number[]){
        //Interface for Pokemon to make it easier to reorder
        interface Pokemon {
            name: string;
            rank: number;
        }

        //Merge sort function
        function mergeSort(arr: Pokemon[]): Pokemon[] {
            if (arr.length <= 1){
                return arr;
            }

            const m = Math.floor(arr.length / 2);
            const l = arr.slice(0, m);
            const r = arr.slice(m);

            return merge(mergeSort(l), mergeSort(r)); //Recursion
        }

        //Remerging arrays
        function merge(l: Pokemon[], r: Pokemon[]): Pokemon[] {
            const result: Pokemon[] = [];
            let lIdx = 0; //Left index
            let rIdx = 0; //Right index

            while (lIdx < l.length && rIdx < r.length) {
                if (l[lIdx].rank > r[rIdx].rank) {
                    result.push(l[lIdx]);
                    lIdx++;
                } else {
                    result.push(r[rIdx]);
                    rIdx++;
                }
            }

            return [...result, ...l.slice(lIdx), ...r.slice(rIdx)]; //Concatenating result, everything left in left side
            //and everything left in right side
        }

        //Match all the names with their ranking into one big array
        const currentData = names.map((name, index) => ({
            name: name,
            rank: curRanking[index]
        }));

        const sorted = mergeSort(currentData);

        setDataSource(sorted.map(p => p.name).slice(0, 10));
        setPkmList(sorted.map(p => p.name));
        setRanking(sorted.map(p => p.rank));
    }

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

    //Fetches data and first 10 catalog list AS SOON AS the page is loaded
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if(pkmList.length != 0){
            fetchMoreData();
        }
    }, [pkmList]);

    //Html displayed
    return(
        <div className="catalog-container">
            <h2>Catalog</h2>
            <InfiniteScroll
                dataLength={dataSource.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={<p>Loading Ranking...</p>}
                endMessage={<p>End of List</p>}
                height={450}
            >
                {dataSource.map((name,index)=>{
                    return <div className="item-style" key={index}>{index+1}. {capitalizeFirstLetter(name)} Score: {ranking[index]}</div>
                })}
            </InfiniteScroll>
            <button onClick={handleSortClick}>{isCalculating ? "Processing..." : "Sort Viability"}</button>
        </div>
    )
}
export default Catalog;