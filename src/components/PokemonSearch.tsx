import React from "react";
import {useEffect, useState} from "react";
import {TypeMap} from "./TypeMap.ts";
import '../Styles/Search.css'

function Search({ party, pushParty, popPartyPokemon }: any) {
    const URL = "https://pokeapi.co/api/v2/pokemon/ditto";
    const SMOGONURL = "https://pkmn.github.io/smogon/data/stats";
    const [name, setName] = useState("pikachu");
    const [type, setType] = useState<any[]>(["electric"]);
    const [numBattles, setNumBattles] = useState(0);
    const [statCoverage, setStatCoverage] = useState("");

    const typeMap = TypeMap;

    async function fetchData() {

            // @ts-ignore
            const pokemonName = document.getElementById("name").value.toLowerCase();

            if(pokemonName.length ==0){
                alert("No pokemon name provided");
                throw new Error("No name");
            }

            //Spaces must be replaced with dashes due to the json's formatting
            const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.replaceAll(' ', '-')}`);
            if (!result.ok) {
                alert("This Pokemon Doesn't exist!");
                throw new Error("Smogon data not found for this pokemon.");
            }

            const resultSmogon = await fetch(`https://pkmn.github.io/smogon/data/stats/gen9ou.json`);
            const tmpType: React.SetStateAction<any[]> = []; //Pokemon can have 2 types
            //pokeapi data
            result.json().then(json => {
                //console.log("PokeAPI data");
                //console.log(json); debug

                setName(json.name);
                for (let i = 0; i < json.types.length; i++) {
                    console.log(json.types[i].type.name);
                    tmpType.push(json.types[i].type.name);
                }
                setType(tmpType);
            })

            //smogon data
            resultSmogon.json().then(json => {
                //console.log("Smogon Data");
                //console.log(json); debugging
                try {
                    setNumBattles(Math.round(json.pokemon[capitalizeFirstLetter(pokemonName)].usage.raw * json.battles));
                    setStatCoverage(findPopularSpread(json.pokemon[capitalizeFirstLetter(pokemonName)].spreads))
                }catch(e) {
                    setNumBattles(0);
                    setStatCoverage("Too Little Use, None Found");
                }
            })


    }

    function findPopularSpread(map: Map<string, number>): string {
        //Key is the stat spread, value is the percentage of usage
        let maxValue: number = -Infinity;
        let maxKey: string = "";
        for (const [key, value] of Object.entries(map)) {
            if (value > maxValue) {
                maxValue = value;
                maxKey = key;
            }
        }
        return maxKey;
    }

    function capitalizeFirstLetter(str: string) {
        //Capitalize letters for api call
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    //------------------Pokemon Classes------------------
    class Pokemon {
        type: string[] = ["electric"];
        species: string = "pikachu"

        constructor(type: string[], species: string) {
            this.type = type;
            this.species = species;
        }

        getType(): string[] {
            return type;
        }

        getSpecies():string{
            return this.species;
        }
    }

    class PartyPokemon extends Pokemon {
        slot: number = -1;
        numBattles: number;
        statCoverage: string;
        recommendedUse: string;

        constructor(type: string[], species: string, slot: number, numBattles: number, statCoverage: string) {
            super(type, species);
            this.slot = slot;
            this.numBattles = numBattles;
            this.statCoverage = statCoverage;
            this.recommendedUse = this.calculateRecommendedUse();
            this.type = type;
        }

        calculateRecommendedUse(): string {
            return "";
        }
    }

    let slot: number = 0;

    async function addPartyPokemon() {
        try {
            //type:string[], species:string, slot:number, numBattles:number, statCoverage:string
            // @ts-ignore
            await fetchData();
            // @ts-ignore
            const species = document.getElementById("name").value.toLowerCase();
            if(species.length ==0){
                alert("Please enter a Pokémon name.");
                throw new Error("No Name");
            }
            const pk = new PartyPokemon(type, species, slot, numBattles, statCoverage);
            pushParty(pk);
            slot = slot + 1;

        } catch (error) {
            console.error(error);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // 1. Prevent the page from reloading
        fetchData();        // 2. Call your existing function
    };

    return (
        <div className="search-container">
            <div className="party">
                <h2>Your Party Pokemon</h2>
                <ol>
                    {party.map((pkm: Pokemon, index:number) =>
                        <li key={index}>
                            <span>{pkm.species}</span>
                        </li>
                    )}
                </ol>
            </div>


            <div className="search">
                <h2>Search for a Pokemon</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <input type="text" id="name" placeholder="Enter Pokemon"/>
                        <br/>
                    </div>
                </form>
                <div>
                    Pokemon Name: {capitalizeFirstLetter(name)} <br/>
                    Type: {type.join(" ")}<br/>
                    Number of Competitive Battles: {numBattles} <br/>
                    Most popular nature & stat spread: {statCoverage} <br/>
                    <button onClick={addPartyPokemon}>Add to Party</button>
                    <button onClick={popPartyPokemon}>Undo</button>
                </div>
            </div>
        </div>
    )
}

export default Search;
