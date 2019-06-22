// We want to create a counter component.
// A label that displays the current value, and a button for incrementing the value


class Counter extends React.Component {
    constructor(props){
        super (props);
        this.increase=this.increase.bind(this);
        this.state={
            count:0
        };
    }
    increase(){
      this.setState ({
       count:this.state.count + 1
    });
}
render(){
    return(
        <div>
            <button onClick={this.increase}>increment</button>
            <span>{this.state.count}</span>
            </div>
    )
}
}


ReactDOM.render(
    <Counter/>,
    document.getElementById("root")
);