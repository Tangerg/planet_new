export namespace library {
	
	export class Album {
	    id: string;
	    name: string;
	    artistId: string;
	    artist: string;
	    year: number;
	    trackCount: number;
	    coverUrl: string;
	    addedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Album(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.artistId = source["artistId"];
	        this.artist = source["artist"];
	        this.year = source["year"];
	        this.trackCount = source["trackCount"];
	        this.coverUrl = source["coverUrl"];
	        this.addedAt = source["addedAt"];
	    }
	}
	export class Track {
	    id: string;
	    title: string;
	    albumId: string;
	    album: string;
	    artistId: string;
	    artist: string;
	    trackNumber: number;
	    discNumber: number;
	    durationMs: number;
	    year: number;
	    genre: string;
	    playUrl: string;
	    coverUrl: string;
	    addedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Track(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.albumId = source["albumId"];
	        this.album = source["album"];
	        this.artistId = source["artistId"];
	        this.artist = source["artist"];
	        this.trackNumber = source["trackNumber"];
	        this.discNumber = source["discNumber"];
	        this.durationMs = source["durationMs"];
	        this.year = source["year"];
	        this.genre = source["genre"];
	        this.playUrl = source["playUrl"];
	        this.coverUrl = source["coverUrl"];
	        this.addedAt = source["addedAt"];
	    }
	}
	export class AlbumDetail {
	    album: Album;
	    tracks: Track[];
	
	    static createFrom(source: any = {}) {
	        return new AlbumDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.album = this.convertValues(source["album"], Album);
	        this.tracks = this.convertValues(source["tracks"], Track);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Artist {
	    id: string;
	    name: string;
	    albumCount: number;
	    trackCount: number;
	    coverUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new Artist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.albumCount = source["albumCount"];
	        this.trackCount = source["trackCount"];
	        this.coverUrl = source["coverUrl"];
	    }
	}
	export class ArtistDetail {
	    artist: Artist;
	    albums: Album[];
	    tracks: Track[];
	
	    static createFrom(source: any = {}) {
	        return new ArtistDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.artist = this.convertValues(source["artist"], Artist);
	        this.albums = this.convertValues(source["albums"], Album);
	        this.tracks = this.convertValues(source["tracks"], Track);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Home {
	    recentTracks: Track[];
	    albums: Album[];
	    artists: Artist[];
	
	    static createFrom(source: any = {}) {
	        return new Home(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.recentTracks = this.convertValues(source["recentTracks"], Track);
	        this.albums = this.convertValues(source["albums"], Album);
	        this.artists = this.convertValues(source["artists"], Artist);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanResult {
	    folder: string;
	    scanned: number;
	    added: number;
	    total: number;
	    durationMs: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.folder = source["folder"];
	        this.scanned = source["scanned"];
	        this.added = source["added"];
	        this.total = source["total"];
	        this.durationMs = source["durationMs"];
	    }
	}
	export class SearchResult {
	    tracks: Track[];
	    albums: Album[];
	    artists: Artist[];
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tracks = this.convertValues(source["tracks"], Track);
	        this.albums = this.convertValues(source["albums"], Album);
	        this.artists = this.convertValues(source["artists"], Artist);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

