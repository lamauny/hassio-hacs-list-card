console.log(`%clist-card\n%cVersion: ${'0.0.3'}`, 'color: rebeccapurple; font-weight: bold;', '');

class ListCard extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
      if (!config.entity) {
        throw new Error('Please define an entity');
      }

      const root = this.shadowRoot;
      if (root.lastChild) root.removeChild(root.lastChild);

      const cardConfig = Object.assign({}, config);
      const columns = cardConfig.columns;
      const card = document.createElement('ha-card');
      const content = document.createElement('div');
      const style = document.createElement('style');
      style.textContent = `
            ha-card {
              /* sample css */
              overflow:auto;
            }
            table {
              width: 100%;
              padding: 0 16px 16px 16px;
            }
            thead th {
              text-align: left;
            }
            tbody tr:nth-child(odd) {
              background-color: var(--paper-card-background-color);
            }
            tbody tr:nth-child(even) {
              background-color: var(--secondary-background-color);
            }
            .button {
              overflow: auto;
              padding: 16px;
            }
            paper-button {
              float: right;
            }
            td a {
              color: var(--primary-text-color);
              text-decoration-line: none;
              font-weight: normal;
            }
            td:hover .tooltip {
              visibility: visible;
              transition-delay: 1s;
              z-index: 99999;
            }
            .tooltip {
              visibility: hidden;
              position: fixed;
              white-space: normal;
              max-width: 30%;
              padding: 1px 2px;
              border: 1px solid #b3c9ce;
              border-radius: 4px;
              text-align: center;
              color: #333;
              background: #fff;
              box-shadow: 3px 3px 3px rgba(0, 0, 0, .3);
            }
          `;

      if (cardConfig.style) {
        let styles = cardConfig['style'];
        for (let index in styles) {
          style.textContent += `ha-card {`;
          if (styles.hasOwnProperty(index)) {
            for (let s in styles[index]) {
              style.textContent += `
              ${s}: ${styles[index][s]};`;
            }
          }
          style.textContent += `}`;
        }
      }
      // Go through columns and add CSS sytling to each column that is defined
      if (columns) {
        for (let column in columns) {
          if (columns.hasOwnProperty(column) && columns[column].hasOwnProperty('style')) {
            let styles = columns[column]['style'];

            style.textContent += `
              .${columns[column].field} {`

            for (let index in styles) {
              if (styles.hasOwnProperty(index)) {
                for (let s in styles[index]) {
                  style.textContent += `
                  ${s}: ${styles[index][s]};`;
                }
              }
            }

            style.textContent += `}`;
          }
        }
      }

      content.id = "container";
      cardConfig.title ? card.header = cardConfig.title : null;
      card.appendChild(content);
      card.appendChild(style);
      root.appendChild(card);
      this._config = cardConfig;
    }

    set hass(hass) {
      const config = this._config;
      const root = this.shadowRoot;
      const card = root.lastChild;
      const old_state = this._hass ? this._hass.states[config.entity] : null;
      this._hass = hass;

      if (hass.states[config.entity] == old_state)
        return;

      if (hass.states[config.entity]) {
        const feed = config.feed_attribute ? hass.states[config.entity].attributes[config.feed_attribute] : hass.states[config.entity].attributes;
        const columns = config.columns;
        this.style.display = 'block';
        const rowLimit = config.row_limit ? config.row_limit : Object.keys(feed).length;
        let rows = 0;

        if (feed !== undefined && Object.keys(feed).length > 0) {
          let card_content = '<table><thread><tr>';

          if (!columns) {
            card_content += `<tr>`;

            for (let column in feed[0]) {
              if (feed[0].hasOwnProperty(column)) {
                card_content += `<th>${feed[0][column]}</th>`;
              }
            }
          } else {
            for (let column in columns) {
              if (columns.hasOwnProperty(column)) {
                card_content += `<th class=${columns[column].field}>${columns[column].title}</th>`;
              }
            }
          }

          card_content += `</tr></thead><tbody>`;

          for (let entry in feed) {
            if (rows >= rowLimit) break;

            if (feed.hasOwnProperty(entry)) {
              if (!columns) {
                for (let field in feed[entry]) {
                  if (feed[entry].hasOwnProperty(field)) {
                    card_content += `<td>${feed[entry][field]}</td>`;
                  }
                }
              } else {
                let has_field = true;

                for (let column in columns) {
                  if (!feed[entry].hasOwnProperty(columns[column].field)) {
                    has_field = false;
                    break;
                  }
                }

                if (!has_field) continue;
                card_content += `<tr>`;

                for (let column in columns) {
                  if (columns.hasOwnProperty(column)) {
                    card_content += `<td class=${columns[column].field} onmouseover="this.childNodes[0].style.top=(event.clientY)+'px';">`;

                    if (columns[column].hasOwnProperty('tooltip')) {
                      card_content +=  `<span class="tooltip">${feed[entry][columns[column].tooltip]}</span>`;
                    }

                    if (columns[column].hasOwnProperty('add_link')) {
                      card_content +=  `<a href="${feed[entry][columns[column].add_link]}" target='_blank'>`;
                    }

                    if (columns[column].hasOwnProperty('type')) {
                      if (columns[column].type === 'image') {
                        if (columns[column].hasOwnProperty('width')) {
                          var image_width = columns[column].width;
                        } else {
                          var image_width = 70;
                        }
                        if (columns[column].hasOwnProperty('height')) {
                          var image_height = columns[column].height;
                        } else {
                          var image_height = 90;
                        }
                        if (feed[entry][columns[column].field][0].hasOwnProperty('url')) {
                            var url = feed[entry][columns[column].field][0].url
                        } else {
                          var url = feed[entry][columns[column].field]
                        }
                          card_content += `<img id="image" src="${url}" width="${image_width}" height="${image_height}">`;
                      } else if (columns[column].type === 'icon') {
                        card_content += `<ha-icon class="column-${columns[column].field}" icon=${feed[entry][columns[column].field]}></ha-icon>`;
                      }
                      // else if (columns[column].type === 'button') {
                      //   card_content += `<paper-button raised>${feed[entry][columns[column].button_text]}</paper-button>`;
                      // }
                    } else {
                      let newText = feed[entry][columns[column].field];

                      if (columns[column].hasOwnProperty('regex')) {
                        newText = new RegExp(columns[column].regex, 'u').exec(feed[entry][columns[column].field]);
                      }
                      if (columns[column].hasOwnProperty('prefix')) {
                        newText = columns[column].prefix + newText;
                      }
                      if (columns[column].hasOwnProperty('postfix')) {
                        newText += columns[column].postfix;
                      }

                      card_content += `${newText}`;
                    }

                    if (columns[column].hasOwnProperty('add_link')) {
                      card_content +=  `</a>`;
                    }

                    card_content += `</td>`;
                  }
                }
              }

              card_content += `</tr>`;
              ++rows;
            }
          }

          root.lastChild.hass = hass;
          card_content += `</tbody></table>`;
          root.getElementById('container').innerHTML = card_content;
        } else {
          this.style.display = 'none';
        }
      } else {
        this.style.display = 'none';
      }
    }

    getCardSize() {
      return 1;
    }
  }

  customElements.define('list-card', ListCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "list-card",
  name: "List Card",
  preview: false,
  description: "The List Card generate table with data from sensor that provides data as a list of attributes."
});
