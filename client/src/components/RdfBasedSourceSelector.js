import React from "react";
import { BrowserRouter as Route, NavLink } from "react-router-dom";
import * as d3 from 'd3';
import UrlParamWrapper from '../aux/UrlParamWrapper';
import parseOntologyJson from '../aux/OntologyParser';
import SparqlQueryBuilder from '../aux/SparqlQueryBuilder.js';
import { sparql } from 'd3-sparql';

const xmlparser = require('fast-xml-parser');

/**
 * Explorer
 * Component for the initial exploration screen. Ontology url and prefix, 
 * and the SPARQL database endpoints are obtained here.
 *
 * @param props
 * @return {React.Component} 
 */
class RdfBasedSourceSelector extends React.Component{
    constructor(props){
        super(props);
        this.state={
            prefix:"oldcan",
            sparql:"http://localhost:3030/oldcan/query",
            ontology_url:"https://explorations4u.acdh.oeaw.ac.at/ontology/oldcan",
            ontology:null,
            ontology_from_file : true,
        };

        this.sparql = sparql;
        this.sparqlQueries = new SparqlQueryBuilder();
        this.wrapper = new UrlParamWrapper();
        this.handleOntologyUrlChange = this.handleOntologyUrlChange.bind(this);
        this.handlePrefixChange = this.handlePrefixChange.bind(this);
        this.handleSparqlChange = this.handleSparqlChange.bind(this);
        this.handleOntologyFileChange = this.handleOntologyFileChange.bind(this);
        this.toggleOntologySource = this.toggleOntologySource.bind(this);
        this.setSources = this.setSources.bind(this);

    }

    handleOntologyFileChange(event){
        function parseOntology(ontology_raw){
            const options = {ignoreAttributes:false, attrValueProcessor:attr=>attr, attributeNamePrefix : ""};
            const ontology_json = xmlparser.parse(ontology_raw,options);
            const ontology_parsed = parseOntologyJson(ontology_json);
            return(ontology_parsed);
        }

        const fr = new FileReader()
        fr.onload = (e)=> this.setState({ontology: (parseOntology(e.target.result))});

        fr.readAsText(event.target.files[0]);
    }

    setSources(ontology, sparql){
        let retrieved = 0;
        let promises = [];
        ontology.entities.map(e=>{
            // A promise for the number of different entries in the database
            promises.push(new Promise((resolve,reject)=>{
                this.sparql(this.state.sparql, 
                    this.sparqlQueries.getEntityCountQuery(e.name, {prefix:ontology.ontology_prefix, uri:ontology.ontology_base}), 
                    (err, data) => {
                        if (data && !err) {
                            resolve(data)
                        } else if (err) throw err
                    });
            }).then((count)=>{
                retrieved += 1;
                for(let i =0; i<ontology.entities.length; i++){
                    if(ontology.entities[i].name == e.name){
                        ontology.entities[i].count = count[0].count.valueOf();
                        break;
                    }
                }
                if(retrieved == ontology.entities.length)
                    this.props.setSources(ontology, sparql);
            }))
        })
    }
     
	handleOntologyUrlChange(event){
		this.setState({ontology_url: event.target.value, Ontology:event.target.value})
	};

	handleSparqlChange(event){
		this.setState({sparql: event.target.value});
	};

	handlePrefixChange(event){
		this.setState({prefix: event.target.value});
	};

    toggleOntologySource(){
        this.setState(prevState=>{
            prevState.ontology_from_file = !prevState.ontology_from_file;
            return(prevState);
        });
    }

	render() {
	    return (
	    	<div id="source_selector">
		      	<form>
                    <span style={{display:this.state.ontology_from_file===true?'inherit':'none', marginBottom:'29px'}}>
                        <label id="extra-label">
                          Ontology file <span className="toggleSource" onClick={()=>this.toggleOntologySource()}>(or load from url)</span> :
                        </label>
                        <label>
                          <input id="uploadInput" type="file" name="myFiles" onInput={this.handleOntologyFileChange}/>
                        </label>
                    </span>

                    <span style={{display:this.state.ontology_from_file===false?'inherit':'none'}}>
                        <label>
                          Url to ontology <span className="toggleSource" onClick={()=>this.toggleOntologySource()}>(or load from local file)</span> :<br/>
                          <input type="text" value={this.state.ontology_url} onChange={this.handleOntologyUrlChange} />
                        </label>
                    </span>
                    
			        <label>
			          Prefix for the ontology:
			          <input type="text" value={this.state.prefix} onChange={this.handlePrefixChange} />
			        </label>
			        <label>
			          Sparql endpoint:
			          <input type="text" value={this.state.sparql} onChange={this.handleSparqlChange} />
			        </label>
		      	</form>
                    {(this.state.ontology != null && this.state.sparql.length>0 && this.state.prefix.length>0)?(
                        <button onClick={()=>this.setSources(this.state.ontology, this.state.sparql)} >Go</button>
                        ):(<button disabled >Go</button>)
                    }
	      	</div>
	    );
	}
}	

export default RdfBasedSourceSelector;
