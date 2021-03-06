import { Client, Intents, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig.js';
import { createHash } from 'crypto';
import { Token } from './libs/Token.js';

// Import config and db
const config = new JsonDB(new Config("config", true, true, '/'));
const db = new JsonDB(new Config("db", true, true, '/'));

// Log with the current date
export async function log(msg) {
    var datetime = new Date().toLocaleString();
    console.log(`[${datetime}] ${msg}`);
};

export async function log_error(msg) {
    log(`ERROR: ${msg}`);
    await (await client.users.fetch(config.getData("/creator_id"))).send(`:warning: ERROR: ${msg}`);
}

// Randomize the main color of the bot
export function get_main_color() {
    return config.getData(`/main_colors[${Math.floor(Math.random() * config.getData(`/main_colors`).length)}]`);
}

// Hash a string
export function hash(str) {
    return createHash('md5').update(str).digest('hex');
}

// Add user to db
export function add_user(id) {
    db.push(`/users/${hash(id)}`, {
        wallet: {
            "59bb9c6f-a67b-4759-bc25-3d3dcdb49d51": 0
        }
    });
    return hash(id);
}

// Get user from db
export function get_user(id, create = false) {
    if (!db.getData(`/users`).hasOwnProperty(hash(id))) {
        if (create) {
            add_user(id);
        } else {
            return undefined;
        }
    }
    return db.getData(`/users/${hash(id)}`);
}

// Get token from db
export function get_token(id) {
    return new Token(id, client, db, config);
}

// Get str amount of tokens
export function get_str_amount(amount, token_id, abbr = true, code = false) {
    let token = get_token(token_id);
    let type;
    if (amount == 1) {
        type = "sing";
    } else {
        type = "plur";
    }
    if (abbr) {
        type += "_abbr";
    }
    if (code) {
        return `\`${amount}\` ${token.name[type]}`;
    }
    return `${amount} ${token.name[type]}`;
}

// Create a new client instance
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
] });

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    await log('Bot logged !');
});

// Set listeners
let cmd_listener = async interaction => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        const command = client.commands.get(commandName);

        if (!command) return;

        log(`${interaction.user.username} execute ${commandName}`);

        await command.execute(interaction, config, db);
    }
}

let help_msg_listener = async msg => {
    if (["help", "$help", "!help", "?help", `<@${client.user.id}>`, `<@${client.user.id}> help`].includes(msg.content.toLowerCase())) {
        await msg.channel.send("Si vous voulez la liste des commandes, utilisez la commande `/help`");
    }
}

client.setMaxListeners(0);
client.on('interactionCreate', cmd_listener);
client.on('messageCreate', help_msg_listener);

// Import all the commands from the commands files
client.commands = new Collection();
const admin_path = "./commands/admin";
const everyone_path = "./commands/everyone";
const commandFiles = {
    admin: readdirSync(admin_path).filter(file => file.endsWith(".js")),
    everyone: readdirSync(everyone_path).filter(file => file.endsWith(".js"))
};
for (const file of commandFiles.admin) {
    import(`./commands/admin/${file}`)
        .then((command) => {
            client.commands.set(command.data.name, command);
        });
}
for (const file of commandFiles.everyone) {
    import(`./commands/everyone/${file}`)
        .then((command) => {
            client.commands.set(command.data.name, command);
        });
}

// Login to Discord
client.login(config.getData("/token"));