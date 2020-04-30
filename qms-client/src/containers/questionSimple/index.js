//@flow

import React from "react";
import Grid from "@material-ui/core/Grid";
import {
  Paper,
  Divider,
  Typography,
  Button,
  Dialog,
  Tab,
  Tabs,
  TextField
} from "@material-ui/core";
import * as apiCategory from "../category/api";
import CategoryList from "../category/components/CategoryList";
import debounce from "lodash/debounce";
import * as api from "../questionEdit/api";

type Props = {};
type State = {
  categoryList: Array<{ id: number, name: string }>,
  categoryLoaded: boolean,
  categoryError: boolean,
  categorySelected: number,
  categoryUrlSelect: number,
  textSearch: string,
  questionList: Array<{
    id: number,
    name: string,
    level: number,
    categoriesNames: Array<string>
  }>
};

export const getDifficultyColor = (level: number) => {
  if (level == 1) {
    return "#03ab00";
  }
  if (level == 2) {
    return "#769400";
  }
  if (level == 3) {
    return "#bf9f00";
  }
  if (level == 4) {
    return "#d66d00";
  }
  if (level == 5) {
    return "#cc0000";
  }
  return "fff";
};

class Question extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      categoryList: [],
      categoryLoaded: false,
      categoryError: false,
      categoryUrlSelect: -1,
      categorySelected: -1,
      textSearch: "",
      questionList: []
    };
    this.debouncedSearch = debounce(this.search, 200);
  }

  componentDidMount = () => {
    this.setStateFromUrl();
  };

  setStateFromUrl = () => {
    if (this.props.location.search) {
      const params = this.props.location.search.slice(1).split("&");
      this.setState(
        {
          categoryUrlSelect: params[0].split("=")[1],
          textSearch: decodeURI(params[1].split("=")[1])
        },
        this.loadCategories
      );
    } else {
      this.loadCategories();
    }
  };

  changeSearchTab = (event, value) => {
    this.setState({
      searchTab: value
    });
  };

  loadCategories = () => {
    apiCategory
      .getAll()
      .then(m => {
        if (!m.data) {
          this.setState({
            categoryLoaded: true,
            categoryError: true
          });
          this.props.showSnack("Could not load categories.", false);
        } else {
          const list = m.data.sort(function(a, b) {
            return a.name < b.name ? -1 : 1;
          });

          let idSelected = -1;
          let cnt = 0;
          m.data.forEach(c => {
            if (c.id == this.state.categoryUrlSelect) {
              idSelected = cnt;
            }
            cnt++;
          });

          this.setState(
            {
              categoryLoaded: true,
              categoryError: false,
              categoryList: m.data,
              categorySelected: idSelected
            },
            this.search
          );
        }
      })
      .catch(e => {
        this.setState({
          categoryLoaded: true,
          categoryError: true
        });
        this.props.showSnack("Could not load categories.", false);
        console.log(e);
      });
  };

  selectCategory = (event, id) => {
    this.setState(
      {
        categorySelected: id
      },
      this.search
    );
  };

  handleTextChange = event => {
    this.setState(
      {
        textSearch: event.target.value
      },
      this.debouncedSearch
    );
  };

  search = () => {
    const cat = this.state.categoryList[this.state.categorySelected];
    const id = cat ? cat.id : -1;
    this.props.history.push(
      "/question/?catId=" + id + "&text=" + this.state.textSearch
    );
    api
      .search(id, this.state.textSearch)
      .then(msg => {
        this.setState({
          questionList: msg.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  };

  edit = (id: number) => {
    this.props.history.push("/question/edit/" + id);
  };

  createNew = () => {
    this.props.history.push("/question/edit/0");
  };

  render() {
    const { searchTab, categoryList } = this.state;
    return (
      <Grid container spacing={16}>
        <Grid item xs={12} sm={12} md={5} lg={5}>
          <Paper>
            <div style={{ padding: 16 }}>
              <Typography variant="h4">Search Questions</Typography>
            </div>
            <Divider />
            <div style={{ padding: "7px 32px 15px 32px" }}>
              <TextField
                id="search-field"
                label="Search question by name"
                value={this.state.textSearch}
                onChange={this.handleTextChange}
                margin="normal"
                variant="outlined"
                style={{ width: 320 }}
              />
            </div>

            <Divider />
            <div>
              <CategoryList
                selectedIndex={this.state.categorySelected}
                handleListItemClick={this.selectCategory}
                items={this.state.categoryList}
                noTitle
                noSelection
              />
            </div>
          </Paper>
          <br />
          <Button variant="contained" color="primary" onClick={this.createNew}>
            Create new
          </Button>
        </Grid>

        {/* as list */}
        <Grid
          item
          xs={12}
          sm={12}
          md={7}
          lg={7}
          style={{
            maxHeight: "calc(100vh - 100px)",
            overflowY: "scroll"
          }}
        >
          {this.state.questionList.map(q => {
            const color = getDifficultyColor(q.level);
            return (
              <div style={{ marginBottom: 14 }} key={q.id}>
                <Paper>
                  <div style={{ borderLeft: `solid 4px ${color}` }}>
                    <div
                      style={{
                        padding: "12px 16px"
                      }}
                    >
                      <Grid container justify="space-between">
                        <Typography variant="h6">{q.name}</Typography>
                        <Button
                          variant="outlined"
                          onClick={() => this.edit(q.id)}
                        >
                          Edit
                        </Button>
                      </Grid>
                    </div>
                    <Divider />
                    <div>
                      <Grid
                        container
                        justify="space-between"
                        style={{ padding: "4px 16px" }}
                      >
                        <Grid item>
                          <Grid container justify="flex-start">
                            {q.categoriesNames.map(name => (
                              <Typography
                                key={name}
                                variant="body2"
                                style={{ paddingRight: 16 }}
                              >
                                {name}
                              </Typography>
                            ))}
                          </Grid>
                        </Grid>
                        <Grid item>
                          <Grid container justify="flex-end">
                            <Typography
                              variant="body2"
                              style={{ paddingRight: 16 }}
                            >
                              {"diff: " + q.level}
                            </Typography>
                            <Typography
                              variant="body2"
                              style={{ paddingRight: 4 }}
                            >
                              {"id: " + q.id}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </div>
                  </div>
                </Paper>
              </div>
            );
          })}
        </Grid>
      </Grid>
    );
  }
}

export default Question;