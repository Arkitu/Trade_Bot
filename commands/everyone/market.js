import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton } from 'discord.js';
import { get_main_color, get_token, get_str_amount } from '../../bot.js';
import { get_message } from '../../libs/Interface.js';

export const data = new SlashCommandBuilder()
    .setName('market')
    .setDescription('Affiche les tokens disponibles à l\'achat');
export async function execute(interaction, config, db) {
    await interaction.deferReply();

    let color = get_main_color();
    
    await interaction.editReply(get_message(interaction.client, config, db, 'general_market', color));
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
                await token.send_main_message(comp_interact, true, color);
                break;
        }
    }
    interaction.client.on('interactionCreate', button_listener);
}