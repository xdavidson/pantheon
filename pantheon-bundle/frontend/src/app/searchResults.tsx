import React, { Component } from "react";

import {
  Table,
  TableHeader,
  TableBody,
  headerCol,
} from "@patternfly/react-table";

import "@app/app.css";
import styles from "@patternfly/react-styles/css/components/Table/table";
import { Pagination } from "@app/Pagination"
import {
  Divider,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStatePrimary,
  Bullseye,
  Title,
  EmptyStateIcon,
  EmptyStateVariant
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

export interface IProps {
  contentType: string
  keyWord: string
  productsSelected: string[]
  repositoriesSelected: string[]
}
export interface ISearchState {

  columns: [
    { title: string, cellTransforms: any },
    { title: string },
    { title: string },
    { title: string }
  ],
  displayLoadIcon: boolean
  filterQuery: string
  isEmptyResults: boolean
  isSearchException: boolean
  // states for pagination
  nextPageRowCount: number
  page: number
  pageLimit: number
  results: any
  rows: any
  showDropdownOptions: boolean
}
class SearchResults extends Component<IProps, ISearchState> {

  constructor(props) {
    super(props);
    this.state = {
      // states for table
      columns: [
        { title: "Document Title", cellTransforms: [headerCol()] },
        { title: "Repository name" },
        { title: "Updated date" },
        { title: "Published date" }
      ],
      displayLoadIcon: true,
      filterQuery: "",
      isEmptyResults: false,
      isSearchException: false,
      // states for pagination
      nextPageRowCount: 1,
      page: 1,
      pageLimit: 5,
      results: [
        {
          "pant:transientPath": "",
          "pant:dateUploaded": "",
          "name": "",
          "jcr:title": "",
          "jcr:description": "",
          "sling:transientSource": "",
          "pant:transientSourceName": "",
          "checkedItem": false,
          "publishedDate": "-",
          "pant:moduleType": "-",
          "variant": ""
        }
      ],
      // states for table
      rows: [
        {
          cells: ["", "", "", ""]
        }
      ],
      showDropdownOptions: true,

    };
  }

  public componentDidMount() {
    this.buildSearchQuery()
    // this.getResults()
    this.doSearch()
  }

  public componentDidUpdate(prevProps) {
    // console.log("[componentDidUpdate] this.props=>", this.props)
    // console.log("[componentDidUpdate] prevprops=>", prevProps)
    if (this.props.repositoriesSelected !== prevProps.repositoriesSelected) {
      // this.buildSearchQuery()
      this.doSearch()
    }

    if (this.props.productsSelected !== prevProps.productsSelected) {
      // this.buildSearchQuery()
      this.doSearch()
    }
  }
  public render() {
    const { columns, rows } = this.state;

    return (
      <React.Fragment>
        <Table aria-label="Simple Table" cells={columns} rows={rows}>
          <TableHeader className={styles.modifiers.nowrap} />
          <TableBody />
        </Table>
        {this.state.isEmptyResults && <EmptyState variant={EmptyStateVariant.small}>
          <EmptyStateIcon icon={SearchIcon} />
          <Title headingLevel="h2" size="lg">
            No results found
        </Title>
          <EmptyStateBody>
            No results match the filter criteria. Select fitler to show results.
        </EmptyStateBody>
          {/* <Button variant="link">Clear all filters</Button> */}
        </EmptyState>
        }
        {/* <div className="notification-container"> */}
        {!this.state.isEmptyResults && <Pagination
          handleMoveLeft={this.updatePageCounter("L")}
          handleMoveRight={this.updatePageCounter("R")}
          handleMoveToFirst={this.updatePageCounter("F")}
          pageNumber={this.state.page}
          nextPageRecordCount={this.state.nextPageRowCount}
          handlePerPageLimit={this.changePerPageLimit}
          perPageLimit={this.state.pageLimit}
          showDropdownOptions={this.state.showDropdownOptions}
          bottom={false}
        />}
        {/* </div> */}
        <Divider />
      </React.Fragment>
    );
  }

  // private methods
  private buildSearchQuery() {
    if ((this.props.repositoriesSelected && this.props.repositoriesSelected.length > 0)
      || (this.props.productsSelected && this.props.productsSelected.length > 0)) {
      console.log("[buildSearchQuery] repositoriesSelected=>", this.props.repositoriesSelected)
      console.log("[buildSearchQuery] productsSelected=>", this.props.productsSelected)
      let backend = "/pantheon/internal/modules.json?"
      backend += this.state.filterQuery
      if (this.state.filterQuery.trim() !== "") {
        backend += "&"
      }
      if (this.props.repositoriesSelected) {
        console.log("[respositoriesSelected]", this.props.repositoriesSelected)
        this.props.repositoriesSelected.map(repo => {
          backend += "repo=" + repo + "&"
        })
      }

      //TODO: enable product filter in the query
      // if (this.props.productsSelected) {
      //   console.log("[productsSelected]", this.props.productsSelected)
      //   this.props.productsSelected.map(product => {
      //     backend += "product=" + product + "&"
      //   })
      // }

      if (this.props.contentType) {
        backend += "&ctype=" + this.props.contentType
      }
      backend += "&offset=" + ((this.state.page - 1) * this.state.pageLimit) + "&limit=" + this.state.pageLimit
      if (!backend.includes("Uploaded") && !backend.includes("direction")) {
        backend += "&key=Uploaded&direction=desc"
      }
      console.log("[search] query=>", backend)
      return backend
    } else {
      return ""
    }
  }

  private setFilterQuery = (filterQuery: string) => {
    this.setState({ filterQuery })
  };

  // methods for pagination
  private updatePageCounter = (direction: string) => () => {
    if (direction === "L" && this.state.page > 1) {
      this.setState({ page: this.state.page - 1 }, () => {
        this.doSearch()
      })
    } else if (direction === "R") {
      this.setState({ page: this.state.page + 1 }, () => {
        this.doSearch()
      })
    } else if (direction === "F") {
      this.setState({ page: 1 }, () => {
        this.doSearch()
      })
    }
  }

  // Handle gateway timeout on slow connections.
  private doSearch = () => {
    this.setState({ displayLoadIcon: true })
    if (this.buildSearchQuery()) {
      fetch(this.buildSearchQuery())
        .then(response => response.json())
        .then(responseJSON => {
          this.setState({ results: responseJSON.results, nextPageRowCount: responseJSON.hasNextPage ? 1 : 0 })
          const data = new Array()
          responseJSON.results.map((item, key) => {
            const publishedDate = item["pant:publishedDate"] !== undefined ? item["pant:publishedDate"] : "-"
            const cellItem = new Array()
            cellItem.push(item["jcr:title"])
            cellItem.push(item["pant:transientSourceName"])
            cellItem.push(item["pant:dateUploaded"])
            cellItem.push(publishedDate)

            data.push({ cells: cellItem })
          })
          if (responseJSON.results.length > 0) {
            this.setState({ rows: data })
          }
          console.log("[getResults] results=>", this.state.results)
          console.log("[getResults] rows=>", this.state.rows)
        })
        .then(() => {
          if (JSON.stringify(this.state.results) === "[]") {
            this.setState({
              displayLoadIcon: false,
              isEmptyResults: true,
              // selectAllCheckValue: false
            })
          } else {
            this.setState({
              displayLoadIcon: false,
              isEmptyResults: false,
              // selectAllCheckValue: false,
            })
          }
        })
        .catch(error => {
          // might be a timeout error
          this.setState({
            displayLoadIcon: false,
            isSearchException: true
          }, () => { console.log("[doSearch] error ", error) })

        })
    } else {
      this.setState({ isEmptyResults: true })
    }
  }

  private changePerPageLimit = (pageLimitValue) => {
    this.setState({ pageLimit: pageLimitValue, page: 1 }, () => {
      // console.log("pageLImit value on calling changePerPageLimit function: "+this.state.pageLimit)
      return (this.state.pageLimit + " items per page")
    })
  }

  // methods for table rows
  private getResults = () => {
    console.log("[getResults] results=>", this.state.results)
    const data = new Array()
    this.state.results.map((item) => {
      const publishedDate = item["pant:publishedDate"] !== undefined ? item["pant:publishedDate"] : "-"
      data.push({ cells: [item.name, "", item["jcr:lastModified"], publishedDate] })
    })
    this.setState({ rows: data })
    console.log("[getResults] rows=>", this.state.rows)
  }
}


export { SearchResults }; 