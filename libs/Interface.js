import { get_main_color } from "../bot.js";
import { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } from "discord.js";

var MAX_ELEMENTS = 10;

export function get_message(client, config, db, embed_name, color = get_main_color(), args = {page: 1}) {
    switch (embed_name) {
        case "general_market": {
            let embed = new MessageEmbed()
                .setColor(color)
                .setTitle('Market');

            let menu_opts = [];
            let ids = [];

            let prefields = [];
            for (let token_id in db.getData(`/tokens`)) {
                let token = get_token(token_id);
                if (token.available == 0) continue;
                prefields.push({
                    name: get_str_amount(token.available, token.id),
                    value: `📉 COURS: ${get_str_amount(token.get_price(), "coins", true, true)} **|** 🧑‍💼 CRÉATEUR: ${(await client.users.fetch(token.data.creator)).username} **|** ${token.name.sing}`
                });
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
                return { embeds: [embed] };
            }
            if (prefields.length > MAX_ELEMENTS) {
                embed.addFields(prefields.slice((args.page-1) * MAX_ELEMENTS, args.page * MAX_ELEMENTS));
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
            return { embeds: [embed], components: components };
        }
    }
}