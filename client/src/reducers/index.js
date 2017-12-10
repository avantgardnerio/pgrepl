const initialState = {
    "circles": [
        {
            "id": "d3c0ebec-02ce-40cc-97dd-6c44219d64cf",
            "cx": 50,
            "cy": 100,
            "r": 40,
            "stroke": "green",
            "strokeWidth": 4,
            "fill": "yellow"
        }
    ],
    "rectangles": [
        {
            "id": "c712ca0d-0040-45ef-8797-fcf9999e8396",
            "width": 400,
            "height": 100,
            "fill": "blue",
            "stroke": "black",
            "strokeWidth": 10
        }
    ]
};

export default (state = initialState, action) => {
    return state;
}