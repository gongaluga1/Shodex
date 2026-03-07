import './App.css'
import React, {useEffect, useState} from "react";
import Search from "./components/PokemonSearch.tsx";
import Catalog from "./components/Catalog.tsx";
import HowTo from "./components/HowTo.tsx";
import {TypeMap} from "./components/TypeMap.ts";

function App() {
    //Stack for the party
    class Stack {
        //Party and setParty must be initialized as they are state variables
        private setParty: React.Dispatch<React.SetStateAction<any[]>>;
        private party: any[];
        constructor(party: any[], setParty: React.Dispatch<React.SetStateAction<any[]>>) {
            this.party = party;
            this.setParty = setParty;
        }

        //Stack methods
        push = async (pokemon: any) => {
            try {
                await pkmExists(pokemon.getSpecies()) //Does not add the Pokemon if it doesn't exist, instead throws an error

                //A Pokemon party cannot exceed 6 Pokemon
                if (this.isFull()) {
                    alert("Party is full!");
                    return;
                }

                //Add the Pokemon to the party array
                this.setParty((prev) => [...prev, pokemon]);
            }catch(e){
                console.error(e);
            }
        }

        //Remove last element of the stack (used for the undo button)
        pop = () => {
            if(!this.isEmpty()) {
                this.setParty((prev) => prev.slice(0, -1)); //Remove everything up to last index
            }
        }

        isEmpty = () => {
            return this.party.length == 0;
        }

        isFull=()=>{
            return this.party.length == 6;
        }

        //Getters and Setters
        getParty() {
            return party;
        }

        getSetState(){
            return setParty;
        }
    }

    //Checks if the Pokemon Exists, used to prevent pushing a non-Pokemon to party
    async function pkmExists(name:string) {
        name = name.toLowerCase().replaceAll(' ', '-');
        const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if(!result.ok){
            alert("This Pokemon Doesn't Exist!");
            throw new Error("Doesn't Exist");
        }
    }

    //Initialize state variables
    const [party, setParty] = useState<any[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const partyStack = new Stack(party, setParty);

    //Returns the type coverage array, UPDATED EVERY TIME PARTY CHANGES!!!!
    //Ensures its always up to date
    const typeCoverage = React.useMemo(() => {
        //Fill an array with 0s, one for each type
        const coverage = Array(18).fill(0);

        //For each Pokemon in the party, get its types and increment the index in the coverage array
        partyStack.getParty().forEach((pokemon) => {
            pokemon.type.forEach((typeName: string) => {
                const idx = TypeMap[typeName.toLowerCase()];
                if (idx !== undefined) {
                    coverage[idx] += 1;
                }
            });
        });
        return coverage; //returning coverage resets the old type coverage
    }, [party]);//updates every time party changes

    //Html
    return (
        <div>
            <h1 className="title">Shodex</h1>
            {/*Help only shown in accordance to the state variable showHelp*/}
            {showHelp && (<HowTo/>)}
            <div className="container">
                <button onClick={() => setShowHelp(!showHelp)}> {/*Opens and closes help*/}
                    Need Help?
                </button>

                {/*Search and Catalog components*/}
                <div className="card">
                    <Search party={partyStack.getParty()} pushParty = {partyStack.push} popPartyPokemon = {partyStack.pop} />
                </div>
                <div className="card">
                    <Catalog typeCoverage = {typeCoverage} />
                </div>
            </div>
        </div>
    )
}

export default App;
