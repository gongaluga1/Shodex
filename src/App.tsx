import './App.css'
import React, {useEffect, useState} from "react";
import Search from "./components/PokemonSearch.tsx";
import Catalog from "./components/Catalog.tsx";
import {TypeMap} from "./components/TypeMap.ts";

function App() {

    class Stack {
        private setParty: React.Dispatch<React.SetStateAction<any[]>>;
        private party: any[];
        constructor(party: any[], setParty: React.Dispatch<React.SetStateAction<any[]>>) {
            this.party = party;
            this.setParty = setParty;
        }

        getParty() {
            return party;
        }

        getSetState(){
            return setParty;
        }

        push = async (pokemon: any) => {
            try {
                await pkmExists(pokemon.getSpecies())
                if (this.isFull()) {
                    alert("Party is full!");
                    return;
                }
                // We use the functional update to ensure we have the latest state
                this.setParty((prev) => [...prev, pokemon]);
            }catch(e){}
        }

        pop = () => {
            if(!this.isEmpty()) {
                this.setParty((prev) => prev.slice(0, -1));
            }
        }

        isEmpty = () => {
            return this.party.length == 0;
        }

        isFull=()=>{
            return this.party.length == 6;
        }


    }

    async function pkmExists(name:string) {
        name = name.toLowerCase().replaceAll(' ', '-');
        const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if(!result.ok){
            alert("This Pokemon Doesn't Exist!");
            throw new Error("Doesn't Exist");
        }
    }

    const [party, setParty] = useState<any[]>([]);
    const partyStack = new Stack(party, setParty);

    const typeCoverage = React.useMemo(() => {
        const coverage = Array(18).fill(0);
        partyStack.getParty().forEach((pkm) => {
            // Use pkm.type (the array of strings)

            pkm.type.forEach((typeName: string) => {
                const index = TypeMap[typeName.toLowerCase()];
                if (index !== undefined) {
                    coverage[index] += 1;
                }
            });
        });
        console.log(coverage);
        return coverage;
    }, [party]);


    return (
        <>
            <div className="container">
                <Search party={partyStack.getParty()} pushParty = {partyStack.push} popPartyPokemon = {partyStack.pop} />
                <Catalog typeCoverage = {typeCoverage} />
            </div>
        </>
    )
}

export default App;
