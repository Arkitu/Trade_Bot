import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { get_user, get_main_color, get_token, get_str_amount } from '../../bot.js';

export const data = new SlashCommandBuilder()
	.setName('wallet')
	.setDescription('Affiche le portefeuille de l\'utilisateur')
    .addUserOption(opt=>
        opt
            .setName('user')
            .setDescription('L\'utilisateur dont on veut afficher le portefeuille (par défaut: vous-même)')
            .setRequired(false)
    )
export async function execute(interaction, config, db) {
	await interaction.deferReply();
    let opt = {
        user: interaction.options.getUser('user') || interaction.user
    }

    let db_user = get_user(opt.user.id, opt.user.id == interaction.user.id);

    if (!db_user) {
        interaction.editReply(`:warning: ${opt.user.username} n'est pas enregistré dans ma base de données.`);
        return;
    }

    let total_in_coins = db_user.wallet["59bb9c6f-a67b-4759-bc25-3d3dcdb49d51"];
    let str_wallet = "";
    for (let token_id in db_user.wallet) {
        let token = get_token(token_id);
        let amount = db_user.wallet[token_id];
        str_wallet += `• ${get_str_amount(amount, token_id, true, true)} | ${token.name.sing}\n`;
        total_in_coins += amount * token.price;
    }

    str_wallet += `\nValeur totale équivalente à ${get_str_amount(total_in_coins / get_token("coins").price, "coins", true, true)}`;

    let embed = new MessageEmbed()
        .setColor(await get_main_color())
        .setTitle(`Portefeuille de ${opt.user.username}`)
        .setDescription(str_wallet)

    await interaction.editReply({ embeds: [embed] });
}