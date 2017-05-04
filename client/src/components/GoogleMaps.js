import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Autocomplete from 'react-google-autocomplete'
import { geocodeByAddress } from 'react-places-autocomplete'
import { Dropdown, Input, Button, Header, Image, Grid } from 'semantic-ui-react';

import ServiceProviderList from './ServiceProviderList';

import _ from 'lodash';
import axios from 'axios';

class GoogleMaps extends Component {
  constructor(){
    super()

    this.state = {
      selectedServiceType: null,
      formattedAddress: '',
      coordinates: {
        lat: null,
        long: null
      },
       // foundServiceUsers: [{lat: 34.055136, lng: -118.308628, name: 'Justin', service: 'Barber'},{lat: 34.044917, lng: -118.296672, name: 'Jason', service: 'Mechanic'}],
      foundServiceUsers: [],
      serviceTypes: []
    }

    this.loadMap = this.loadMap.bind(this);
    this.putMarkersOnMap = this.putMarkersOnMap.bind(this);
    // this.changeSelectedAddress = this.changeSelectedAddress.bind(this);
    this.displaySelectedAddress = this.displaySelectedAddress.bind(this);
    this.changeSelectedService = this.changeSelectedService.bind(this);
    // this.serviceFilter = this.changeSelectedService.bind(this);
    // this.withinRange = this.withinRange.bind(this);
    // this.fetchUsers = this.fetchUsers.bind(this);
    this.clearMarkers = this.clearMarkers.bind(this);
    this.loadServices = this.loadServices.bind(this);

    this.googleMap = null;
    this.googleMapMarkers = [];
  }

  componentDidMount() {
    this.loadServicesTypes();
    this.loadMap();
  }

  loadServicesTypes() {
    axios.get('/api/services')
      .then(result => {
        _.each(result.data, service => {
          this.setState({
            serviceTypes: this.state.serviceTypes.concat([{text: service.type, value: service.id, key: service.id}])
          })
        })
      }).catch(err => {
      console.log('Error loading serviceTypes: ', err);
    })
  }

  loadServices() {
    let axios_config = {
      params: {
        lat: this.state.coordinates.lat,
        long: this.state.coordinates.long,
        distance: 30,
      }
    };

    if(this.state.selectedServiceType){
      axios_config.params['services'] = this.state.selectedServiceType;
    }

    axios.get('/api/services/find', axios_config)
      .then(result => {
        this.setState({foundServiceUsers: result.data}, ()=>{
          console.log(this.state.foundServiceUsers, this.state.selectedServiceType)
          this.putMarkersOnMap(this.googleMap)
        })
      }).catch(err => {
      console.log('Error loading foundServiceUsers: ', err);
    })
  }

  // componentDidUpdate() {
  //   this.serviceFilter();
  // }
/////////////////////// Sets Markers on Map and ties them to an info window/////////////////////////////
//
//   fetchUsers() {
//     axios.get('/services')
//          .then(data => {
//            _.each(data, datum => {
//              this.setState({users:[...this.state.users, datum]})
//            })
//          }).catch(err => {
//            console.log('Error with fetchUsers: ', err);
//          })
//   }

/////////////////////// Sets Markers on Map and ties them to an info window/////////////////////////////

  clearMarkers() {
    _.each(this.googleMapMarkers, (marker) => {
      marker.setMap(null)
    })
    this.googleMapMarkers = [];
  }

  putMarkersOnMap(map) {
      const maps = google.maps;
      this.clearMarkers();
      _.each(this.state.foundServiceUsers, user => {
        console.log('put marker', user.geo_lat, user.geo_long);
        let marker = new maps.Marker({
          position: {lat: user.geo_lat, lng: user.geo_long},
          map: map
        })
        this.googleMapMarkers.push(marker);
        let contentString = `<div id="content">` + `<div id="siteNotice">` + `</div>` +
        `<h1 id="firstHeading" class="firstHeading">${user.name}</h1>` +
        `<image wrapped size="medium" src="http://images4.wikia.nocookie.net/marveldatabase/images/9/9b/Ultimate_spiderman.jpg" height="85" width="85"/>` +
        `<div id="bodyContent">` + `<h2>${user.service}</h2>` + `</div>`;
        let infoWindow = new maps.InfoWindow({
          content: contentString
        })
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        })
      })
    }

/////////////////////// Loads map at their location. Adds marker for their location too/////////////////////////////


  loadMap() {
    const homeUrl = "https://cdn3.iconfinder.com/data/icons/map-markers-1/512/residence-512.png";
    if (this.props && this.props.google) {
      const { google } = this.props;
      const maps = google.maps;
      
      const mapRef = this.refs.map;
      const node = ReactDOM.findDOMNode(mapRef);

      let { initialCenter, zoom } = this.props;
      // const { lat, lng } = !this.props.address ? this.state.coordinates : this.props.address;
        // !this.state.currentLocation.lat || !this.state.currentLocation.lng ? initialCenter : this.state.currentLocation;
      const center = new maps.LatLng(this.state.coordinates.lat, this.state.coordinates.long);
      const mapConfig = Object.assign({}, {
        center: center,
        zoom: zoom
      })
      this.map = new maps.Map(node, mapConfig);
      this.googleMap = this.map

      const home = {
        url: homeUrl,
        scaledSize: new google.maps.Size(40,40),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(20,20)
      }
      const marker = new maps.Marker({
        map: this.map,
        draggable: false,
        animation: maps.Animation.DROP,
        position: center,
        icon: home,
        title: "Your Location"
      })
      marker.setMap(this.map);
      // this.putMarkersOnMap(this.map);
    }
  }

//////////////////////////////////// Changes state of currentAddress to geocode ///////////////////////////////

  // changeSelectedAddress(event) {
  //   event.preventDefault();
  //   console.log(event.target)
  //   this.setState({
  //     formattedAddress: event.target.value
  //   });
  // }

///////////////////////////// Geocodes location to give lat and lng and runs loadMap ///////////////////////////////
///////////////////////////// Need to control submit occurring before place selected ///////////////////////////////

  displaySelectedAddress(event) {
    event.preventDefault();
    this.loadMap();
    this.loadServices();

    // geocodeByAddress(this.state.currentAddress, (err, latLng) => {
    //   if(err) {
    //     console.log('Error with geocoding: ', err);
    //   } else {
    //     console.log('Lat and Lng obtained: ', latLng.lat, latLng.lng);
    //     this.setState({currentLocation:{lat:latLng.lat, lng:latLng.lng}});
    //
    //   }
    // })
  }

//////////////////////////////////// Filter through services ///////////////////////////////

  // serviceFilter(event) {
  //   event.preventDefault();
  //   axios.get(`/services/${this.state.service}/${this.state.currentLocation}`)
  //        .then(data => {
  //          console.log(data);
  //          _.each(data, datum => {
  //           datum.service === this.state.service && withinRange(this.state.currentLocation.lat, this.state.currentLocation.lng, data.lat, data.lng) <= 10 ? this.setState({foundServiceUsers:[...this.state.foundServiceUsers, datum]}) : null
  //          })
  //        })
  // }

//////////////////////////////////// Set state of chosen service from drop down ///////////////////////////////

  changeSelectedService(event, result) {
    event.preventDefault();
    this.setState({selectedServiceType: result.value});
    this.loadServices()
  }

//////////////////////////////////// Find if the coordinates are within range of the user ///////////////////////////////

  // withinRange(lat1,lng1,lat2,lng2) {
  //     const R = 3959;
  //     let deg2rad = (deg) => {
  //       return deg * (Math.PI/180)
  //     }
  //     let dLat = deg2rad(lat2-lat1);
  //     let dLng = deg2rad(lng2-lng1);
  //     let a =
  //       Math.sin(dLat/2) * Math.sin(dLat/2) +
  //       Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
  //       Math.sin(dLng/2) * Math.sin(dLng/2)
  //       ;
  //     let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  //     let d = R * c;
  //     return d;
  //   }

//////////////////////////////////// Search Bar to render coordinates ///////////////////////////////

  render() {
    return (
      <div style={{textAlign:'center'}}>
        <form onSubmit={this.displaySelectedAddress}>
          <Input placeholder="Enter Your Location">
            <Autocomplete
              style={{width: 601}}
              // onChange={this.changeSelectedAddress}
              onPlaceSelected={(foundLocation) => {
                this.setState({
                  formattedAddress: foundLocation.formatted_address,
                  coordinates: {
                    lat: foundLocation.geometry.location.lat(),
                    long: foundLocation.geometry.location.lng()
                    }
                  });
              }}
              types={['address']}
              componentRestrictions={{country: "USA"}}
            />
          </Input>
        </form>
        <br/>
        <form>
          <Dropdown onChange={this.changeSelectedService} placeholder="Select Your Service" fluid selection options={this.state.serviceTypes} style={{width: 600}}>
          </Dropdown>
        </form>
        <br/>
        <div className="google-maps" ref="map" style={{width: 600, height: 600}}></div>
        <br/>
        <br/>
        <br/>
        <ServiceProviderList users={this.state.foundServiceUsers}/>
      </div>
    );
  }

}

GoogleMaps.propTypes = {
  google: PropTypes.object,
  zoom: PropTypes.number,
  initialCenter: PropTypes.object
}

GoogleMaps.defaultProps = {
  zoom: 15,
  initialCenter: {
    lat: 34.049963,
    long: -118.300709
  }
}

export default GoogleMaps;

// When we have more services
// fluid search selection options={ServiceOptions}