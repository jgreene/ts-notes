import "babel-polyfill";
import * as React from 'react'
import * as ReactDOM from 'react-dom';

import { withStyles } from '@material-ui/core/styles';
import { CssBaseline, Grid, Card, CardHeader, CardContent, Toolbar, AppBar, IconButton, Typography, Button } from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu';
import { ItemGrid } from './components/index';

import { TestForm } from './test-form'
import { TestDeriveForm } from './test-derive'
import { PersonForm } from './test-form-state'

const styles = {
    root: {
        flexGrow: 1,
    },
    flex: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
};

interface Props {
    classes: {
        root: string;
        menuButton: string;
        flex: string;
    }
}

class App extends React.Component<Props> {
    render() {
        const { classes } = this.props;
        return (
            <React.Fragment>
                <CssBaseline />
                <div className={classes.root}>
                    <AppBar position="static">
                        <Toolbar>
                            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="title" color="inherit" className={classes.flex}>
                                Crud
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </div>
                <Grid container>
                    <ItemGrid xs={12} sm={12} md={8}>
                        <Card>
                            <CardHeader title={'Edit Person'} subheader="12345" />
                            <CardContent>
                                <PersonForm />
                            </CardContent>
                        </Card>
                    </ItemGrid>
                </Grid>
            </React.Fragment>
        )
    }
}

const StyledApp = withStyles(styles)(App)

ReactDOM.render(<StyledApp />, document.getElementById('root'));