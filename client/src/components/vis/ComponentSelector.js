import * as d3 from 'd3';
import React from 'react';
import Dropdown from 'react-dropdown';
import Carousel from 'nuka-carousel';
import 'react-dropdown/style.css'
import OptionTags from './OptionTags.js';

/* ComponentSelector
 * Allows the creation of new vis components by calling the addComponent function
 * provided as a prop, using the selected name, type and subset of entities.
 *
 * Each of the attributes selected is stored as an object with the following attributes :
    name: a full descriptive name for the attribute,
    type: data type for the tag,
    attribute: attribute selected to be displayed or aggregated,
    aggregation: the type of aggregation to be used,
    aggregation_term: the attribute by which to aggregate,
    data_total: the total count of different values,
    unique: the total size of the dataset
 */

class ComponentSelector extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            name: "",
            attributes: [],
            type: "",
            showComponents: false,
            data : [],
            useful_visualizations: [],
            vis_incompatibilities: []
        };

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.createComponent = this.createComponent.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.showComponents = this.showComponents.bind(this);
        this.backToEntities = this.backToEntities.bind(this);
        this.addAttribute = this.addAttribute.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
    }

    handleNameChange(event){
        this.setState({name: event.target.value});
    };

    addAttribute(attribute){
        if(attribute){
            this.setState((prevState)=>{
                const index = prevState.attributes.map(a=>a.name).indexOf(attribute.name);
                // If it is not already included
                if(index ==-1){
                    if(attribute.aggregation == 'none'){
                        attribute.unique = this.props.data.length;
                        attribute.data_total = this.props.data.length;
                    }else{
                        // Compute the amount of different groups available
                        const attribute_values = {};
                        this.props.data.map(e=>{
                            if(!attribute_values[e[attribute.aggregation_term]])
                                attribute_values[e[attribute.aggregation_term]]=1;
                        });
                        attribute.unique = d3.keys(attribute_values).length;
                        attribute.data_total = this.props.data.length;

                    } 
                    prevState.attributes.push(attribute)
                }
                return(prevState);
            });
        }
    }

    removeAttribute(attribute){
        if(attribute)
            this.setState((prevState)=>{
                prevState.attributes = prevState.attributes.filter(e=>e.name!=attribute.name);
                return(prevState);
            });
    }

    handleTypeChange(type){
        this.setState({type: type});
    };

    createComponent(){
        if(this.state.name != "" && this.state.attributes.length>0 && this.state.type != ""){
            this.props.addComponent(this.state.name, this.state.attributes, this.state.type);
            this.setState({name: "", attributes: [], showComponents:false});
        }
    }

    showComponents(){
        let useful_visualizations = this.props.availableComponents;
        const vis_incompatibilities = [];

        if(this.state.attributes.length < 2){
            useful_visualizations = useful_visualizations.filter(vis=>vis!='Parallel Coordinates');
            vis_incompatibilities.push(`At least two values have to selected to use Parallel Coordinates.`);
        }

        if(true === this.state.attributes.reduce((a,b)=>a||b.aggregation!='none',false)){
            useful_visualizations = useful_visualizations.filter(vis=>vis!='Parallel Coordinates');
            vis_incompatibilities.push(`Metrics cannot be used with Parallel Coordinates.`);
        }

        this.state.attributes.map(a=>{
            if(a.unique > 120){
                vis_incompatibilities.push(`${a.name} takes too many different values to be used with a Pie Chart.`);
                vis_incompatibilities.push(`${a.name} takes too many different values to be used with an Bar Chart.`);
            }
        })

        if(false === this.state.attributes.reduce((a,b)=>a&&b.unique<140,true)){
            useful_visualizations = useful_visualizations.filter(vis=>vis!='Pie Chart');
            vis_incompatibilities.push(`No attribute has less than 120 different values to be used with a Pie Chart.`);
            useful_visualizations = useful_visualizations.filter(vis=>vis!='Bar Chart');
            vis_incompatibilities.push(`No attribute has less than 120 different values to be used with an Bar Chart.`);
        }

        if(false === this.state.attributes.reduce((a,b)=>a&&(b.unique == this.state.attributes[0].unique),true)){
            useful_visualizations = useful_visualizations.filter(vis=>vis!='Table');
            vis_incompatibilities.push(`All attributes must have the same amount of entries to be displayed in a table.`);
        }

        this.setState({showComponents:true, type:useful_visualizations[0], useful_visualizations:useful_visualizations, vis_incompatibilities:vis_incompatibilities});
    }

    backToEntities(){
        this.setState({showComponents:false});
    }

    renderMenu(){
        const carouselOptions = {
            "Table":<img onClick={()=>this.handleTypeChange("Table")} 
                className="button" alt="Table" title="Table" key="Table"
                height={this.props.height-200} src="/public/table.svg" 
            />,
            "Pie Chart":<img onClick={()=>this.handleTypeChange("Pie Chart")} 
                className="button" alt="Pie Chart" title="Pie Chart" key="Pie Chart"
                height={this.props.height-200} src="/public/pie.svg" 
            />,
            "Parallel Coordinates":<img onClick={()=>this.handleTypeChange("Parallel Coordinates")} 
                className="button" alt="Parallel Coordinates" title="Parallel Coordinates" key="Parallel Coordinates"
                height={this.props.height-200} src="/public/ppcc.svg" 
            />,
            "Bar Chart":<img onClick={()=>this.handleTypeChange("Bar Chart")} 
                className="button" alt="Bar Chart" title="Bar Chart" key="Bar Chart"
                height={this.props.height-200} src="/public/bar.svg" 
            />,
        };

        if(this.state.name != "" && this.state.attributes.length>0 && this.state.showComponents === true){
            return(
            <div className="menu-panel">
                <ul>
                    <li>Variables chosen <a onClick={()=>this.backToEntities()}>(back to selection)</a> :</li>
                    <li>{this.state.attributes.reduce((a,b)=>b.name+', '+a, "")}</li>
                    <hr/><br/>
                    <li>Click on the visualization prefered. Currently selected : {this.state.type}</li>
                    <li>
                        <Carousel dragging={false} 
                                swiping={false} 
                                wrapAround={true}
                                cellAlign={"center"}>
                                {this.state.useful_visualizations.map(x=>carouselOptions[x])}
                          </Carousel>
                    </li>
                </ul>
                <a onClick={()=>alert(this.state.vis_incompatibilities.map(e=>`${e}\n`))} style={{cursor:'pointer'}}>Show incompatiblities </a>
                <br/>
                <a onClick={this.createComponent}>Create component</a>
            </div>
            );
        }else{
            const selectionMade = this.state.name != "" && this.state.attributes.length>0;
            return(
            <div className="menu-panel">
            <ul>
                <li>Name for the new component :</li>
                <li><input type="text" value={this.state.name} onChange={this.handleNameChange} /></li>
            </ul>
            <ul>
                <li>Variables to explore on the new component :</li>
                <li>
                    <OptionTags 
                        tags={this.state.attributes}
                        options={this.props.entities}
                        addTag={this.addAttribute}
                        removeTag={this.removeAttribute}
                    />
                </li>
            </ul>
            <a onClick={()=>this.showComponents()} style={{display:selectionMade===true?'initial':'none'}}>Choose visualization</a>
            </div>
            );
        }
    }

    render(){
        const size = {width: this.props.width+"px", height: this.props.height+"px"}

        return(
            <div id="ComponentSelector" style={size}>
                {this.renderMenu()}
            </div>
        );
    }
}

export default ComponentSelector;
