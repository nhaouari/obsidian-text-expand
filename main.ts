import {App, View, Plugin, PluginSettingTab, Setting, TFile, FileView, MarkdownView} from 'obsidian';
import removeMd from "remove-markdown";


interface Config {
    id: string
    name: string
    format: (e: string) => string
}

interface Files {
    file: TFile
}

function inlineLog(str: string) {
    console.log(str)
    return str
}

export default class TextExpander extends Plugin {
    delay = 2000;
    textExtraction= "Activated";
    defaultSize=30;
    onload() {
        this.addSettingTab(new SettingTab(this.app, this));

        console.log('Loading Text Expander');
        const config: Config[] = [
            {
                id: 'editor:expandEmbeds',
                name: 'embeds',
                format: e => '![[' + e + ']]'
            },
            {
                id: 'editor:expandLinks',
                name: 'links',
                format: e => '[[' + e + ']]'
            },
            {
                id: 'editor:expandList',
                name: 'list of links',
                format: e => '- [[' + e + ']]'
            },
            {
                id: 'editor:expandTODO',
                name: 'list of TODO',
                format: e => '- [ ] [[' + e + ']]'
            },
        ]

        const reformatLinks = (links: Files[], mapFunc: (s: string) => string,size:number): string => {
            const currentView = this.app.workspace.activeLeaf.view
            const query:string=  this.app.workspace.getLeavesOfType('search')[0].view.searchQuery.query;
        
          /*  if (currentView instanceof FileView) {
                return links.map(e => e.file.name)
                    .filter(e => currentView.file.name !== e)
                    .map(mapFunc).join('\n')
            }
            */
           console.log(links);
            return links.filter(ele=>ele.file.name!==currentView.file.name).map((ele)=>{
                const ref:string= mapFunc(ele.file.name);
                const titleSize=20;

                let extractedText=ref;
               if(this.textExtraction=="Activated"){
                    extractedText = "# "+ele.file.name+" ("+ele.result.content.length+")"+"\n"+ref+"\n";
                    let minIndex= 9999999;
                    let maxIndex= 0;
                
                    ele.result.content.forEach(position => {
                        const minTitle:Number=Math.max(position[0]-titleSize,0);
                        const maxTitle:Number=Math.min(position[1]+titleSize,ele.content.length-1);
                        const min:Number=Math.max(position[0]-size,0);
                        const max:Number=Math.min(position[1]+size,ele.content.length-1);


                       // console.log({min,max,minIndex,maxIndex})
                       if(!((min>=minIndex && min <= maxIndex) || (max>=minIndex && max <= maxIndex))){ 
                        minIndex=Math.min(minIndex,position[0]);
                        maxIndex=Math.max(maxIndex,position[1]);

                        extractedText+="## ..."+removeMd(ele.content.substring(minTitle,maxTitle).replace("\n"," "))+"...\n"; 
                        //console.log(ele.content.substring(min,max));
                        extractedText+="\t"+removeMd(ele.content.substring(min,max))+"\n\n"; 
                        }
                    });
                }
                extractedText.replace(query,"*"+query+"*");

                return extractedText;
            }).join('\n')

            //return links.map(e => e.file.name).map(mapFunc).join('\n')
            
            }

        function getLastLineNum(doc: CodeMirror.Doc, line = 0): number {
            const lineNum = line === 0
                ? doc.getCursor().line
                : line

            if (doc.lineCount() === lineNum) {
                return doc.getCursor().line + 1
            }

            return doc.getLine(lineNum) === '---'
                ? lineNum
                : getLastLineNum(doc, lineNum + 1)
        }

        const initExpander = (mapFunc: (e: string) => string) => {
            // Search files
            let cmDoc = null as CodeMirror.Doc || null
            // @ts-ignore
            const globalSearchFn = this.app.internalPlugins.getPluginById('global-search').instance.openGlobalSearch.bind(this)


            const search = (query: string) => globalSearchFn(inlineLog(query))

            const getFoundFilenames = (mapFunc: (s: string) => string, callback: (s: string) => any,size:number) => {
                const searchLeaf = this.app.workspace.getLeavesOfType('search')[0]
                searchLeaf.open(searchLeaf.view)
                    .then((view: View) => setTimeout(() => {
                        // Using undocumented feature
                        // @ts-ignore
                        const result = reformatLinks(view.dom.resultDoms, mapFunc,size)
                        callback(result)
                        this.app.commands.commands["editor:fold-all"].checkCallback();
                    }, this.delay))
            }

            const currentView = this.app.workspace.activeLeaf.view

            if (currentView instanceof MarkdownView) {
                cmDoc = currentView.sourceMode.cmEditor
            }

            const hasFormulaRegexp = /^\{\{.+\}\}$/
            const curNum = cmDoc.getCursor().line
            const curText = cmDoc.getLine(curNum)

            if (!hasFormulaRegexp.test(curText)) {
                return
            }

            const isEmbed = cmDoc.getLine(curNum - 1) === '```expander'
                && cmDoc.getLine(curNum + 1) === '```'

            const fstLineNumToReplace = isEmbed
                ? curNum - 1
                : curNum
            const lstLineNumToReplace = isEmbed
                ? getLastLineNum(cmDoc)
                : curNum

            let searchQuery = curText.replace('{{', '').replace('}}', '')
            let size = this.defaultSize;
             if(searchQuery.indexOf("/") !== -1) {
                size = +searchQuery.split("/")[1];
                searchQuery = searchQuery.split("/")[0];
            }

            const embedFormula = '```expander\n' +
                '{{' + searchQuery + '}}\n' +
                '```\n'

            const replaceLine = (content: string) => cmDoc.replaceRange(embedFormula + content + '\n\n---',
                {line: fstLineNumToReplace, ch: 0},
                {line: lstLineNumToReplace, ch: cmDoc.getLine(lstLineNumToReplace).length}
            )

            search(inlineLog(searchQuery))
            getFoundFilenames(mapFunc, replaceLine,size)
        }

        config.forEach(e => {
            this.addCommand({
                id: e.id,
                name: e.name,
                callback: () => initExpander(e.format),
                hotkeys: []
            })
        })
    }

    onunload() {
        console.log('unloading plugin');
    }
}

class SettingTab extends PluginSettingTab {
    plugin: TextExpander

    constructor(app: App, plugin: TextExpander) {
        super(app, plugin);

        this.app = app
        this.plugin = plugin
    }

    display(): void {
        let {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Settings for Text Expander'});

        new Setting(containerEl)
            .setName('Delay')
            .setDesc('Text expander don\' wait until search completed. It waits for a delay and paste result after that.')
            .addSlider(slider => {
                slider.setLimits(1000, 10000, 1000)
                slider.setValue(this.plugin.delay)
                slider.onChange(value => this.plugin.delay = value)
                slider.setDynamicTooltip()
            })
        
        new Setting(containerEl)
            .setName('Text Extraction')
            .setDesc('Add extracted text to the found results.')
            .addDropdown((cb)=>{
                cb.addOption("Activated","Activated");
                cb.addOption("Disabled","Disabled");
                cb.setValue(this.plugin.textExtraction);
                cb.onChange(value => this.plugin.textExtraction = value);
            })
        
        new Setting(containerEl)
            .setName('Default Size')
            .setDesc('The number of the chars to extract before and after the found text')
            .addText((text)=>{
                text.setValue(this.plugin.defaultSize.toString());
                text.onChange(value => this.plugin.defaultSize = +value);
            })
    }
}
