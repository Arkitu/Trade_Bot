import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton } from 'discord.js';
import { get_main_color, get_token, get_str_amount } from '../../bot.js';

var MAX_ELEMENTS = 10;

export const data = new SlashCommandBuilder()
	.setName('market')
	.setDescription('Affiche les tokens disponibles à l\'achat');
export async function execute(interaction, config, db) {
	await interaction.deferReply();

    let color = get_main_color();
    let embed = new MessageEmbed()
        .setColor(color)
        .setTitle('Market')
    
    let menu_opts = [];
    let ids = [];

    let prefields = [];
    let tokens = [];
    for (let token_id in db.getData(`/tokens`)) {
        let token = get_token(token_id);
        if (token.available == 0) continue;
        prefields.push({
            name: get_str_amount(token.available, token.id),
            value: `📉 COURS: ${get_str_amount(token.get_price(), "coins", true, true)} **|** 🧑‍💼 CRÉATEUR: ${(await interaction.client.users.fetch(token.data.creator)).username} **|** ${token.name.sing}`
        });
        tokens.push(token);
        menu_opts.push({
            label: token.name.sing,
            value: ids.length.toString()
        });
        ids.push(token.id);
    }
    let select_menu = new MessageActionRow();
    let buttons = new MessageActionRow();
    let components = [];
    if (prefields.length == 0) {
        embed.setDescription('Aucun token disponible à l\'achat.');
        await interaction.editReply({ embeds: [embed] });
        return;
    }
    let page = 1;
    if (prefields.length > MAX_ELEMENTS) {
        embed.addFields(prefields.slice(0, MAX_ELEMENTS));
        select_menu.addComponents(
            new MessageSelectMenu()
                .setCustomId('select_token')
                .setPlaceholder('Choisissez un token')
                .setOptions(menu_opts.slice(0, MAX_ELEMENTS))
        );
        buttons.addComponents(
            new MessageButton()
                .setCustomId('next_page')
                .setEmoji('➡')
                .setStyle('PRIMARY')
        );
        components.push(select_menu, buttons);
    } else {
        embed.addFields(prefields);
        select_menu.addComponents(
            new MessageSelectMenu()
                .setCustomId('select_token')
                .setPlaceholder('Choisissez un token')
                .setOptions(menu_opts)
        );
        components.push(select_menu);
    }
    await interaction.editReply({ embeds: [embed], components: components });
    let msg = await interaction.fetchReply();
    let button_listener = async comp_interact => {
        if ((!comp_interact.isButton()) && (!comp_interact.isSelectMenu())) return;
        if (comp_interact.message.id != msg.id) return;
        if (comp_interact.user.id != interaction.user.id) {
            comp_interact.reply({ content: ':warning: Seul l\'utilisateur ayant affiché le marcket peut intéragir avec. Pour pouvoir intéragir, utilisez `/market`', ephemeral: true });
            return;
        }
        switch (comp_interact.customId) {
            case 'next_page':
                page += 2;
            case 'prev_page':
                page--;
                await msg.embeds[0].setFields(prefields.slice(MAX_ELEMENTS * (page - 1), MAX_ELEMENTS * page));
                select_menu.setComponents([
                    new MessageSelectMenu()
                        .setCustomId('select_token')
                        .setPlaceholder('Choisissez un token')
                        .setOptions(menu_opts.slice(MAX_ELEMENTS * (page - 1), MAX_ELEMENTS * page))
                ]);
                buttons.setComponents([]);
                if (page * MAX_ELEMENTS <= prefields.length) {
                    buttons.addComponents([
                        new MessageButton()
                            .setCustomId('next_page')
                            .setEmoji('➡')
                            .setStyle('PRIMARY')
                    ]);
                }
                if (page > 1) {
                    buttons.addComponents([
                        new MessageButton()
                            .setCustomId('prev_page')
                            .setEmoji('⬅')
                            .setStyle('PRIMARY')
                    ]);
                }
                components = [select_menu, buttons];
                comp_interact.update({ embeds: [msg.embeds[0]], components: components });
                break;
            case 'select_token':
                let token = get_token(ids[comp_interact.values[0]]);
                msg.edit({ components: [] });
                comp_interact.update(await token.get_main_message(color));
                break;
        }
    }
    interaction.client.on('interactionCreate', button_listener);
}