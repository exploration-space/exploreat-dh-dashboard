import * as d3 from 'd3';
import React from 'react';
import d3tip from 'd3-tip';
import Select from 'react-select';
import SearchField from 'react-search-field';
import { schemeSet1 } from 'd3-scale-chromatic';
import * as legend from 'd3-svg-legend';

/* PackedBubbles
 * Dummy component for scaffolding vis components
 * Vis components are provided with width, height and data props
 *
 * Data is provided as an array of objects
 */



const xOffset = 350

class PackedBubbles extends React.Component{
    constructor(props){
        super(props);

        this.options = [];
        this.optionsMap = {};
        
        this.props.entities.map(e=>{
            this.options.push({value: e,label: e});
            this.optionsMap[e] = e;
        });

        this.state = {
            clusterOption: this.options[0],
            colorOption: this.options[1],
            xAxis: d3.axisBottom(),
            xScale: d3.scalePoint(),
            colorScale: d3.scaleOrdinal(schemeSet1),
            colorLegend: legend.legendColor().orient("vertical"),
            forceX: d3.forceX(),
            forceY: d3.forceY(),
            simulation: d3.forceSimulation(),
            searchTerm: '',
            shouldUpdateForce: true
        };

        this.createOverviewChart = this.createOverviewChart.bind(this)
        this.updateForce = this.updateForce.bind(this)
        this.updateColors = this.updateColors.bind(this)
        this.updateHighlights = this.updateHighlights.bind(this)
        this.handleClusterSelectChange = this.handleClusterSelectChange.bind(this)
        this.handleColorSelectChange = this.handleColorSelectChange.bind(this)
        this.handleSearchChange = this.handleSearchChange.bind(this)
    }

    handleClusterSelectChange(clusterOption) {
        this.setState({ clusterOption, shouldUpdateForce : true })
        console.log(`Cluster selected:`, clusterOption);
    }

    handleColorSelectChange(colorOption) {
        this.setState({ colorOption, shouldUpdateForce : false })
        console.log(`Color selected:`, colorOption);
    }

    handleSearchChange(value, event) {
        this.updateHighlights(value)
    }

    componentDidMount() {
        this.createOverviewChart()
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.shouldUpdateForce)
            this.updateForce()
        else 
            this.updateColors()

        if(prevProps.width != this.props.width){
            const t = d3.transition().duration(500);
            
            d3.select('.colorLegend').transition(t)
                .attr("transform", `translate(${this.props.width - 170}, 100)`);
        }

    }


    createOverviewChart() {
        if (this.props.data.length == 0) return 

        this.updateConfig()
        const { data } = this.props
        const { colorOption } = this.state
        
        const node = d3.select(this.node)
        

        const radiusScale = d3.scaleLinear()
                        .domain([0,2])//d3.extent(data, d => d.n))
                        .range([4, 15])

        node.append("g")
        .attr("class", "legendSize")
        .attr("transform", "translate(20, 100)")

        const legendCircle = legend.legendSize()
                            .scale(radiusScale)
                            .ascending(true)
                            .title('# questions')
                            .shape('circle')
                            .shapePadding(15)
                            .labelOffset(20)
                            .orient('vertical')

        node.select('.legendSize')
                    .call(legendCircle)


        const colorKeys = d3.map(data, d => d[this.optionsMap[colorOption.value]]).keys().sort()
        this.state.colorScale.domain(colorKeys)

        node.append("g")
            .attr("class", "colorLegend")
            .attr("transform", `translate(${this.props.width - 120}, 100)`)

        this.state.colorLegend.scale(this.state.colorScale).title(colorOption.label)

        node.select('.colorLegend').call(this.state.colorLegend)


        const tip = d3tip().attr('class', 'd3-tip').html(d => {
            return `<p>Questionnaire ${d.Questionnaire}</p>
                    <p>${d.title}</p>
                    <p>? questions</p>
                    <p>${d.LastName+','+d.FirstName}</p>
                    <p>Published in ${d.publicationYear}</p>`
        })

        node.call(tip)

        const circles = node.append('g')
                        // .attr('transform', `translate(${xOffset}, 0)`)
                        .attr('class', 'circles')
                        .selectAll('circle')
                        .data(data)
                        .enter().append("circle")
                        .attr("r", d=> radiusScale(1))
                        .attr("fill", d=> this.state.colorScale(d[this.optionsMap[colorOption.value]]))
                        .on('mouseover', tip.show)
                        .on('mouseout', tip.hide)

        node.append('g')
                .attr('transform', `translate(0, ${this.props.height - 50})`)
                .attr('id', 'xAxisG')
                .call(this.state.xAxis)
            .selectAll('text')
            .attr('y', 8)
            .attr('x', -3)
            .attr('dy', '.35em')
            .attr('transform', "rotate(-45)")
            .attr('text-anchor', "end")

        this.state.simulation
                        .velocityDecay(0.3)
                        .force('x', this.state.forceX)
                        .force('y', this.state.forceY)
                        .force('collide', d3.forceCollide(15))

        this.state.simulation.nodes(data)
            .on('tick', function() {
                circles
                    .attr('transform', d => {
                        return `translate(${d.x}, ${d.y})`
                    })
        })
        
    }


    updateConfig() {
        const { data } = this.props
        const { clusterOption, colorOption } = this.state

        
        const clusterKeys = d3.map(data, d => d[this.optionsMap[clusterOption.value]]).keys().sort()
        this.state.xScale
                .domain(clusterKeys)
                .range([xOffset, this.props.width - xOffset])

        this.state.xAxis.scale(this.state.xScale)
        
        
        this.state.forceX.x((d) => this.state.xScale(d[this.optionsMap[clusterOption.value]]))
        this.state.forceY.y((d) => this.props.height / 2)
        
    }


    updateForce() {
        this.updateConfig()
        const t = d3.transition().duration(500)
        const nodeSelection = d3.select(this.node)

        nodeSelection.select("#xAxisG")
                        .call(this.state.xAxis)
                    .selectAll('text')
                    .attr('y', 8)
                    .attr('x', -3)
                    .attr('dy', '.35em')
                    .attr('transform', "rotate(-45)")
                    .attr('text-anchor', "end")

        this.state.simulation
                .force('x', this.state.forceX)
                .force('y', this.state.forceY)
        this.state.simulation.alpha(1).restart()    
    }

    updateColors() {
        const { colorOption } = this.state
        const { data } = this.props
        const colorKeys = d3.map(data, d => d[this.optionsMap[colorOption.value]]).keys().sort()
        this.state.colorScale.domain(colorKeys)
        this.state.colorLegend.scale(this.state.colorScale).title(colorOption.label)
        const t = d3.transition().duration(500)
        
        d3.select('.colorLegend').call(this.state.colorLegend);

        d3.select('.circles').selectAll('circle').transition(t)
            .attr("fill", d=> this.state.colorScale(d[this.optionsMap[colorOption.value]]));     
    }

    updateHighlights(searchTerm) {
        console.log('updateHighlights')
        const t = d3.transition().duration(500)
        d3.select('.circles').selectAll('circle').transition(t).style('opacity', d => d.title.indexOf(searchTerm) == -1 ? 0.2 : 1)
    }



    render() {
        let { clusterOption, colorOption } = this.state 
        const size = {
            width: this.props.width+"px",
            height: (this.props.height)+"px"
        }

        const styleAttr1 = (e)=>this.state.attr1.attribute==e?{cursor:"pointer",color:"#18bc9c", marginLeft:"5px"}:
            {cursor:"pointer",color:"black", marginLeft:"5px"};

        const styleAttr2 = (e)=>this.state.attr2.attribute==e?{cursor:"pointer",color:"#18bc9c", marginLeft:"5px"}:
            {cursor:"pointer",color:"black", marginLeft:"5px"};

        return (
        <div id="PackedBubbles" className="visualization" style={size} ref={node => this.domElement = node}>
            <div id='container'>
                <div id='top-container'>
                    <SearchField
                        id='searchfield' 
                        placeholder='Search title'
                        onChange={this.handleSearchChange}
                    />
                    <Select
                            id='color-select'
                            className='selector'
                            value={colorOption}
                            onChange={this.handleColorSelectChange}
                            options={this.options}
                        />
                    <Select
                    id='cluster-select'
                    className='selector'
                    value={clusterOption}
                    onChange={this.handleClusterSelectChange}
                    options={this.options}
                />
                </div>
                <svg ref={node => this.node = node} width={this.props.width} height={this.props.height}>
                </svg>
            </div>
        </div>)

    }
}

export default PackedBubbles;
