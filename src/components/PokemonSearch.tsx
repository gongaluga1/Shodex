import React from "react";
import {useState} from "react";
import '../Styles/Search.css'

function Search({ party, pushParty, popPartyPokemon }: any) {
    const [name, setName] = useState("pikachu");
    const [type, setType] = useState<string[]>(["electric"]);
    const [numBattles, setNumBattles] = useState(0);
    const [statCoverage, setStatCoverage] = useState("");
    const [sprite, setSprite] = useState("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png");
    const [ability, setAbility] = useState("Lightning Rod");

    async function fetchData() {
        //Takes the Pokemon name from the text field
        // @ts-ignore
        const pokemonName = document.getElementById("name").value.toLowerCase();

        //Catches the nothing entered case
        if(pokemonName.length ==0){
            alert("No pokemon name provided");
            throw new Error("No name");
        }

        //Spaces must be replaced with dashes due to the json's formatting
        const result = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.replaceAll(' ', '-')}`);
        //If the Pokemon doesn't exist (e.g A typo) throw an error
        if (!result.ok) {
            alert("This Pokemon Doesn't exist!");
            throw new Error("Smogon data not found for this pokemon.");
        }

        //Get pokeapi data for type and sprite
        const tmpType: React.SetStateAction<string[]> = []; //Pokemon can have 2 types
        result.json().then(json => {
            //Set name, type and sprite
            setName(json.name);
            for (let i = 0; i < json.types.length; i++) {
                console.log(json.types[i].type.name);
                tmpType.push(json.types[i].type.name);
            }
            setType(tmpType);
            setSprite(json.sprites.front_default)
        })

        //Gets the smogon data to retreive the stats
        const resultSmogon = await fetch(`https://pkmn.github.io/smogon/data/stats/gen9ou.json`);
        resultSmogon.json().then(json => {
            try {
                //Set usage, nautre/stats and ability
                setNumBattles(Math.round(json.pokemon[capitalizeFirstLetter(pokemonName)].usage.raw * json.battles));
                setStatCoverage(findPopularSpread(json.pokemon[capitalizeFirstLetter(pokemonName)].spreads))

                //Find the most used ability
                const abilities = json.pokemon[capitalizeFirstLetter(pokemonName)].abilities
                let maxKey = "";
                let maxVal: unknown = 0;
                for (const [key, value] of Object.entries(abilities)) {
                    console.log(key, value);
                    // @ts-ignore
                    if(value>maxVal){
                        maxVal = value;
                        maxKey = key;
                    }
                }
                setAbility(maxKey);

            }catch(e) {
                //If there's no data on the Pokemon
                setNumBattles(0);
                setStatCoverage("No Data Found");
                setAbility("No Data Found");
                console.log("No data on Pokemon"+e);
            }
        })
    }

    //Finding the most popular nature/ev spread
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

    //Capitalizing first letter for api formatting
    function capitalizeFirstLetter(str: string) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    //------------------Pokemon Classes------------------
    class Pokemon {
        type: string[] = ["electric"]; //Default as pikachu
        species: string = "pikachu";

        //Initialize variables
        constructor(type: string[], species: string) {
            this.type = type;
            this.species = species;
        }

        //Getters and setters
        getType(): string[] {
            return type;
        }

        getSpecies():string{
            return this.species;
        }
    }

    //Pokemon in the party
    class PartyPokemon extends Pokemon {
        //All the descriptors of a Pokemon
        numBattles: number;
        statCoverage: string;
        sprite: string;
        ability: string;

        //Initializing variables
        constructor(type: string[], species: string, numBattles: number, statCoverage: string, sprite: string, ability:string) {
            super(type, species);
            this.numBattles = numBattles;
            this.statCoverage = statCoverage;
            this.type = type;
            this.sprite = sprite;
            this.ability = ability;
        }
    }

    //Adding/Creating a party Pokemon
    async function addPartyPokemon() {
        try {
            // @ts-ignore
            const species = document.getElementById("name").value.toLowerCase();

            //Reset the name in case the user does not press enter which, in that case, will not reset te name
            setName(species);
            //Refetchs the data to get data of the Pokemon
            await fetchData();

            //Only creates a Pokemon if the Pokemon's description is already displayed
            //This fixes the issue of the state updating asynchronously, causing the old Pokemon's
            //Name and sprite to show up in party
            if(species == name) {
                const pk = new PartyPokemon(type, species, numBattles, statCoverage, sprite, ability);
                pushParty(pk); //Pushes the new Pokemon into the party in App.tsx
            }
        } catch (error) {
            console.error(error);
        }
    }

    //When submitting form, do not refresh the page and fetch the data to display Pokemon
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    //Generate a txt file based on the party
    async function showdownPaste(){
        let text = "";
        for(let i = 0; i < party.length; i++){
            text += capitalizeFirstLetter(party[i].species)+"\n";
            if(party[i].ability != "No Data Found"){
                text += "Ability: "+party[i].ability+"\n";

                const natureStat = party[i].statCoverage.split(":");
                text += natureStat[0]+" Nature\n";
                text += "EVS: "+natureStat[1]+"\n";
            }
        }

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Team.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="search-container">
            <div className="party">
                {/*Displays all party Pokemon and their Sprites*/}
                <h2>Your Party Pokemon</h2>
                <ol className="partyList">
                    {party.map((pkm: PartyPokemon, index:number) =>
                        <li key={index} >
                            <span>{capitalizeFirstLetter(pkm.species)}</span>
                            <img src={pkm.sprite} alt={name} />
                        </li>
                    )}
                </ol>
                <button onClick={showdownPaste}>Download</button>
            </div>


            <div className="search">
                {/*Displays the Pokemon search*/}
                <h2>Search for a Pokemon</h2>
                {/*Pokemon text field*/}
                <form onSubmit={handleSubmit}>
                    <div>
                        <input type="text" id="name" placeholder="Enter Pokemon"/>
                        <br/>
                    </div>
                </form>

                {/*Displays Pokemon Description*/}
                <img src={sprite} alt={name} />
                <div>
                    Pokemon Name: {capitalizeFirstLetter(name)} <br/>
                    Type: {capitalizeFirstLetter(type.join(" "))}<br/>
                    Ability: {ability}<br/>
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
