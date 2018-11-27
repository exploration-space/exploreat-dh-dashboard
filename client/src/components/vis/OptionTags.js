import * as d3 from 'd3';
import React from 'react';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css'

/* ComponentSelector
 * Allows the creation of new vis components by calling the addComponent function
 * provided as a prop, using the selected name, type and subset of entities.
 */

class OptionTags extends React.Component{
    constructor(props){
        super(props);

        this.state={
            addingTag: false,
            type: 'string',
            attribute: '',
            aggregation: 'none',
            aggregation_term: 'none',
        };

        this.renderTags = this.renderTags.bind(this);
        this.toggleOptions = this.toggleOptions.bind(this);
        this.toggleSelection = this.toggleSelection.bind(this);

        this.aggregationOptions = ['none', 'count']
    }    

    renderTags(){
        return(
            this.props.tags.map(tag=>(
                <div className="tag" key={tag.name}>
                    <span> {tag.type} </span>
                    <span> {tag.name} </span>
                    <span><a onClick={()=>this.props.remove(tag)}> X </a></span>
                </div>
            ))
        );
    }

    toggleOptions(){
        this.setState(prev=>{
            prev['addingTag']=!prev['addingTag'];
            return(prev);
        })
    }

    toggleSelection(type, attribute){
        if(attribute && attribute.length>0)
            this.setState((prevState)=>{
                if(prevState[type] == attribute)
                    prevState[type] = '';
                else
                    prevState[type] = attribute;
                return(prevState);
            });
    };

    render(){
        const style = (type, e)=>this.state[type] == e?{cursor:"pointer",color:"#18bc9c"}:{cursor:"pointer",color:"black"};

        return(
            <div id="OptionTags">
                <div id="tags">
                    {this.renderTags()}
                    <div id="add-tag" className="tag"><a onClick={()=>this.toggleOptions()}> Add + </a></div>
                </div>
                <div id="options" style={{display: this.state.addingTag===true?'block':'none'}}>
                    <div id="table">
                        <ul>
                            <li>Attribute</li><hr/>
                            {this.props.options.map(option=>(
                                <li key={option} 
                                    onClick={()=>this.toggleSelection('attribute', option)}
                                    style={style('attribute',option)}>{option}</li>
                            ))}
                        </ul>
                        <ul>
                            <li>Aggregation</li><hr/>
                            {this.aggregationOptions.map(option=>(
                                <li key={option} 
                                    onClick={()=>this.toggleSelection('aggregation', option)}
                                    style={style('aggregation',option)}>{option}</li>
                            ))}
                        </ul>
                        <ul>
                            <li>Aggregate by</li><hr/>
                            <li onClick={()=>this.toggleSelection('aggregation_term', 'none')}
                                    style={style('aggregation_term','none')}>none</li>
                            {this.props.options.map(option=>(
                                <li key={option} 
                                    onClick={()=>this.toggleSelection('aggregation_term', option)}
                                    style={style('aggregation_term',option)}>{option}</li>
                            ))}
                        </ul>
                    </div>
                    <a onClick={()=>this.toggleOptions()}> Cancel </a>
                    <a onClick={()=>this.addTag()}> Add </a>
                </div>
            </div>
        );        
    }
}

export default OptionTags;
